using System;
using System.Collections.Generic;
using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using CleanArchitecture.Player.Presentation;
using NUnit.Framework;
using R3;

namespace CleanArchitecture.Player.Tests.EditMode
{
    public sealed class PlayerPresenterTests
    {
        private SampleMotor _motor;
        private PlayerPresenter _presenter;
        private List<PlayerViewState> _states;
        private IDisposable _subscription;
        private PlayerViewState Current => _states[_states.Count - 1];

        [SetUp]
        public void SetUp()
        {
            _motor = new SampleMotor();
            _presenter = new PlayerPresenter(new UpdatePlayerMotionUseCase(
                new PlayerMotionRules(), _motor, new StubSettings()));
            _states = new List<PlayerViewState>();
            _subscription = _presenter.ViewStates.Subscribe(_states.Add);
        }

        [TearDown]
        public void TearDown()
        {
            _subscription.Dispose();
            _presenter.Dispose();
        }

        [Test]
        public void Subscribe_ImmediatelyReceivesInitialIdleWithoutLanding()
        {
            var landings = 0;
            using var subscription = _presenter.Landed.Subscribe(_ => landings++);
            Assert.That(_states, Is.EqualTo(new[] { new PlayerViewState(PlayerLocomotion.Idle, 1) }));
            Sample(0f, 0f, true);
            Assert.That(landings, Is.Zero);
            Assert.That(_states.Count, Is.EqualTo(1));
        }

        [TestCase(0f, 0f, true, PlayerLocomotion.Idle)]
        [TestCase(0.04f, 0f, true, PlayerLocomotion.Idle)]
        [TestCase(1f, 0f, true, PlayerLocomotion.Run)]
        [TestCase(-1f, 0f, true, PlayerLocomotion.Run)]
        [TestCase(0f, 2f, false, PlayerLocomotion.Jump)]
        [TestCase(0f, 0f, false, PlayerLocomotion.Fall)]
        [TestCase(0f, -2f, false, PlayerLocomotion.Fall)]
        public void MotionResult_SelectsSemanticOutput(float x, float y, bool grounded, PlayerLocomotion expected)
        {
            Sample(x, y, grounded);
            Assert.That(Current.Locomotion, Is.EqualTo(expected));
        }

        [Test]
        public void ThresholdEquality_RetainsPreviousStateWithinTheSameStateGroup()
        {
            Sample(0.05f, 0f, true);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Idle));
            Sample(0.1f, 0f, true);
            Sample(0.05f, 0f, true);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Run));
            Sample(0f, 0.01f, false);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Fall));
            Sample(0f, 0.02f, false);
            Sample(0f, 0.01f, false);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Jump));
            Sample(0f, 0f, false);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Fall));
        }

        [Test]
        public void Facing_UsesInputAndRetainsDirectionInsideDeadZone()
        {
            Sample(0f, 0f, true, -1f);
            Sample(0f, 0f, true, 0.0001f);
            Assert.That(Current.FacingDirection, Is.EqualTo(-1));
            Sample(0f, 0f, true, 1f);
            Sample(0f, 0f, true, -0.0001f);
            Assert.That(Current.FacingDirection, Is.EqualTo(1));
        }

        [Test]
        public void SpeedChangesWithinSameExpression_DoNotRepublishOrRestartExpression()
        {
            Sample(1f, 0f, true);
            Sample(2f, 0f, true);
            Sample(3f, 0f, true);
            Assert.That(_states.Count, Is.EqualTo(2));
        }

        [Test]
        public void Landing_PublishesOncePerAirborneToGroundedEdgeAfterLatestState()
        {
            var landingStates = new List<PlayerViewState>();
            using var subscription = _presenter.Landed.Subscribe(_ => landingStates.Add(Current));
            Sample(0f, 0f, true);
            Sample(0f, 1f, false);
            Sample(0f, -1f, false);
            Sample(1f, 0f, true);
            Sample(2f, 0f, true);
            Sample(0f, -1f, false);
            Sample(0f, 0f, true);
            Assert.That(landingStates, Is.EqualTo(new[]
            {
                new PlayerViewState(PlayerLocomotion.Run, 1),
                new PlayerViewState(PlayerLocomotion.Idle, 1)
            }));
        }

        [Test]
        public void JumpFromGround_UsesApplicationAirborneResultWithoutFalseLanding()
        {
            var landings = 0;
            using var subscription = _presenter.Landed.Subscribe(_ => landings++);
            Sample(0f, 0f, true);
            Sample(0f, 0f, true, 0f, true);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Jump));
            Assert.That(_motor.Applied.VerticalVelocity, Is.EqualTo(11f));
            Assert.That(landings, Is.Zero);
            Sample(0f, -1f, false);
            Sample(0f, 0f, true);
            Assert.That(landings, Is.EqualTo(1));
        }

        [Test]
        public void Presentation_DoesNotOverrideMotorGroundedSampleUsingVerticalVelocity()
        {
            var landings = 0;
            using var subscription = _presenter.Landed.Subscribe(_ => landings++);
            Sample(0f, 8f, false);
            Sample(0f, 7f, true);
            Assert.That(Current.Locomotion, Is.EqualTo(PlayerLocomotion.Idle));
            Assert.That(landings, Is.EqualTo(1), "접지 방향 수정은 Infrastructure의 별도 작업이다.");
        }

        [Test]
        public void Resubscribe_ReceivesLatestStateButNeverReplaysPastLandings()
        {
            _subscription.Dispose();
            Sample(0f, -1f, false);
            Sample(1f, 0f, true, -1f);
            Assert.That(_states.Count, Is.EqualTo(1));
            var landings = 0;
            using var landingSubscription = _presenter.Landed.Subscribe(_ => landings++);
            using var stateSubscription = _presenter.ViewStates.Subscribe(_states.Add);
            Assert.That(Current, Is.EqualTo(new PlayerViewState(PlayerLocomotion.Run, -1)));
            Assert.That(landings, Is.Zero);
            Sample(0f, -1f, false);
            Sample(0f, 0f, true);
            Assert.That(landings, Is.EqualTo(1));
        }

        [Test]
        public void OutputContracts_DoNotExposeWritableOrDisposableSources()
        {
            Assert.That(_presenter.ViewStates, Is.Not.InstanceOf<ReactiveProperty<PlayerViewState>>());
            Assert.That(_presenter.ViewStates, Is.Not.InstanceOf<IDisposable>());
            Assert.That(_presenter.Landed, Is.Not.InstanceOf<Subject<Unit>>());
            Assert.That(_presenter.Landed, Is.Not.InstanceOf<IDisposable>());
        }

        [Test]
        public void Dispose_CompletesBothStreamsOnceAndRejectsFurtherMotion()
        {
            var stateCompletions = 0;
            var landingCompletions = 0;
            using var states = _presenter.ViewStates.Subscribe(_ => { }, _ => stateCompletions++);
            using var landings = _presenter.Landed.Subscribe(_ => { }, _ => landingCompletions++);
            _presenter.Dispose();
            _presenter.Dispose();
            Assert.That(stateCompletions, Is.EqualTo(1));
            Assert.That(landingCompletions, Is.EqualTo(1));
            Assert.Throws<ObjectDisposedException>(() => _presenter.UpdateMotion(1f, true, 0.02f));
            Assert.That(_motor.ApplyCount, Is.Zero);
        }

        private void Sample(float x, float y, bool grounded, float input = 0f, bool jump = false)
        {
            _motor.State = new PlayerMotionState(x, y, grounded);
            _presenter.UpdateMotion(input, jump, 0.02f);
        }

        private sealed class SampleMotor : IPlayerMotor
        {
            public PlayerMotionState State;
            public PlayerMotionDecision Applied;
            public int ApplyCount;
            public PlayerMotionState ReadState() => State;
            public void Apply(PlayerMotionDecision decision)
            {
                Applied = decision;
                ApplyCount++;
            }
        }

        private sealed class StubSettings : IPlayerMotionSettings
        {
            public PlayerMotionConfig MotionConfig => new PlayerMotionConfig(8f, 0f, 0f, 11f);
        }
    }
}
