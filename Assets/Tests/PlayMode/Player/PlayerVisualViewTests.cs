using System.Collections;
using CleanArchitecture.Core.Installer;
using CleanArchitecture.Player.Presentation;
using CleanArchitecture.Player.View;
using NUnit.Framework;
using R3;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using VContainer;

namespace CleanArchitecture.Player.Tests.PlayMode
{
    public sealed class PlayerVisualViewTests
    {
        private GameObject _object;
        private PlayerVisualView _view;
        private SpriteRenderer _renderer;
        private Animator _animator;
        private ReactiveProperty<PlayerViewState> _states;
        private Subject<Unit> _landed;
        private int _landingDeliveries;

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            yield return SceneManager.LoadSceneAsync("ArchitectureSandbox", LoadSceneMode.Single);
            Object.FindFirstObjectByType<PlayerInputView>().enabled = false;
            var original = GameObject.Find("Player/Visual");
            _object = new GameObject("Reactive output test");
            _object.SetActive(false);
            _renderer = _object.AddComponent<SpriteRenderer>();
            _renderer.sprite = original.GetComponent<SpriteRenderer>().sprite;
            _animator = _object.AddComponent<Animator>();
            _animator.runtimeAnimatorController = original.GetComponent<Animator>().runtimeAnimatorController;
            _animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            _view = _object.AddComponent<PlayerVisualView>();
            _states = new ReactiveProperty<PlayerViewState>(new PlayerViewState(PlayerLocomotion.Idle, 1));
            _landed = new Subject<Unit>();
            _landingDeliveries = 0;
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            Object.Destroy(_object);
            yield return null;
            _states.Dispose();
            _landed.Dispose();
        }

        [Test]
        public void InitializeWhileInactive_SubscribesOnlyOnEnableAndImmediatelySynchronizes()
        {
            Initialize();
            Assert.That(_states.HasObservers, Is.False);
            SetState(PlayerLocomotion.Run, -1);
            _landed.OnNext(Unit.Default);
            _object.SetActive(true);
            _animator.Update(0f);
            Assert.That(_states.HasObservers, Is.True);
            Assert.That(_renderer.flipX, Is.True);
            AssertCurrent("Run");
            Assert.That(_landingDeliveries, Is.Zero);
        }

        [Test]
        public void InitializeAfterEnable_AndRepeatedInitialize_DoNotDuplicateSubscriptions()
        {
            _object.SetActive(true);
            Initialize();
            Initialize();
            Initialize();
            _landed.OnNext(Unit.Default);
            Assert.That(_landingDeliveries, Is.EqualTo(1));
            _view.enabled = false;
            Assert.That(_states.HasObservers, Is.False);
            _landed.OnNext(Unit.Default);
            Assert.That(_landingDeliveries, Is.EqualTo(1));
        }

        [Test]
        public void Reenable_UsesLatestStateWithoutReplayingDisabledOrPendingLanding()
        {
            Activate();
            _landed.OnNext(Unit.Default); // Animator가 아직 소비하지 않은 trigger도 해제해야 한다.
            _view.enabled = false;
            SetState(PlayerLocomotion.Run, -1);
            _landed.OnNext(Unit.Default);
            Assert.That(_renderer.flipX, Is.False);
            Assert.That(_landingDeliveries, Is.EqualTo(1));
            _view.enabled = true;
            _animator.Update(0.1f);
            AssertCurrent("Run");
            Assert.That(_renderer.flipX, Is.True);
            Assert.That(_landingDeliveries, Is.EqualTo(1));
        }

        [Test]
        public void ReinitializeWithAnotherSource_DetachesBothOldStreams()
        {
            Activate();
            using var replacement = new ReactiveProperty<PlayerViewState>(new PlayerViewState(PlayerLocomotion.Run, -1));
            using var replacementLanding = new Subject<Unit>();
            _view.Initialize(replacement.AsObservable(), replacementLanding.AsObservable());
            Assert.That(_states.HasObservers, Is.False);
            Assert.That(replacement.HasObservers, Is.True);
            SetState(PlayerLocomotion.Jump, 1);
            _landed.OnNext(Unit.Default);
            Assert.That(_renderer.flipX, Is.True);
            Assert.That(_animator.GetInteger("Locomotion"), Is.EqualTo((int)PlayerLocomotion.Run));
            Assert.That(_landingDeliveries, Is.Zero);
        }

        [UnityTest]
        public IEnumerator Destroy_ReleasesSubscriptionsWithoutDisposingSources()
        {
            Activate();
            Object.Destroy(_view);
            yield return null;
            Assert.That(_states.HasObservers, Is.False);
            Assert.That(_states.IsDisposed, Is.False);
            SetState(PlayerLocomotion.Run);
            _landed.OnNext(Unit.Default);
            Assert.That(_landingDeliveries, Is.Zero);
        }

        [Test]
        public void SourceCompletion_DetachesAndDoesNotResubscribeToDisposedSource()
        {
            Activate();
            _states.Dispose();
            _landed.OnNext(Unit.Default);
            _view.enabled = false;
            _view.enabled = true;
            Assert.That(_landingDeliveries, Is.Zero);
            LogAssert.NoUnexpectedReceived();
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceDisposedWhileDetached_ReenableDoesNotAttach(bool disposeLandingOnly)
        {
            Activate();
            _view.enabled = false;
            if (disposeLandingOnly) _landed.Dispose();
            else _states.Dispose();
            _view.enabled = true;
            Assert.That(_states.HasObservers, Is.False);
            LogAssert.NoUnexpectedReceived();
        }

        [Test]
        public void DirectionChangeDuringRun_DoesNotRestartTheClip()
        {
            SetState(PlayerLocomotion.Run);
            Activate();
            _animator.Update(0.2f);
            var before = _animator.GetCurrentAnimatorStateInfo(0).normalizedTime;
            SetState(PlayerLocomotion.Run, -1);
            _animator.Update(0.1f);
            AssertCurrent("Run");
            Assert.That(_animator.GetCurrentAnimatorStateInfo(0).normalizedTime, Is.GreaterThan(before));
            Assert.That(_renderer.flipX, Is.True);
        }

        [Test]
        public void Landing_PlaysThenReturnsToLatestGroundExpression()
        {
            SetState(PlayerLocomotion.Fall);
            Activate();
            _animator.Update(0f);
            SetState(PlayerLocomotion.Idle);
            _landed.OnNext(Unit.Default);
            StepAnimator(0.07f);
            AssertCurrent("Land");
            SetState(PlayerLocomotion.Run);
            StepAnimator(0.08f);
            AssertCurrent("Land");
            StepAnimator(0.3f);
            AssertCurrent("Run");
            Assert.That(_landingDeliveries, Is.EqualTo(1));
        }

        [TestCase(PlayerLocomotion.Jump)]
        [TestCase(PlayerLocomotion.Fall)]
        public void AirExpression_InterruptsLandingBeforeItsGroundExitTime(PlayerLocomotion air)
        {
            Activate();
            _landed.OnNext(Unit.Default);
            StepAnimator(0.07f);
            AssertCurrent("Land");
            SetState(air);
            StepAnimator(0.08f);
            AssertCurrent(air.ToString());
        }

        [Test]
        public void AirExpressionBeforeAnimatorEvaluation_ClearsPendingLanding()
        {
            Activate();
            _landed.OnNext(Unit.Default);
            SetState(PlayerLocomotion.Jump);
            StepAnimator(0.1f);
            AssertCurrent("Jump");
        }

        [Test]
        public void ContainerDisposal_CompletesPresenterOwnedStreams()
        {
            var scope = Object.FindFirstObjectByType<GameLifetimeScope>();
            var presenter = scope.Container.Resolve<PlayerPresenter>();
            var completed = 0;
            using var states = presenter.ViewStates.Subscribe(_ => { }, _ => completed++);
            using var landed = presenter.Landed.Subscribe(_ => { }, _ => completed++);
            scope.DisposeCore();
            Assert.That(completed, Is.EqualTo(2));
        }

        private void Initialize() => _view.Initialize(
            _states.AsObservable(), _landed.Do(_ => _landingDeliveries++));

        private void Activate()
        {
            Initialize();
            _object.SetActive(true);
            _animator.Update(0f);
        }

        private void SetState(PlayerLocomotion locomotion, int direction = 1) =>
            _states.Value = new PlayerViewState(locomotion, direction);

        private void StepAnimator(float duration)
        {
            for (var elapsed = 0f; elapsed < duration; elapsed += 0.01f) _animator.Update(0.01f);
        }

        private void AssertCurrent(string state) =>
            Assert.That(_animator.GetCurrentAnimatorStateInfo(0).IsName("Base Layer." + state), Is.True, state);
    }
}
