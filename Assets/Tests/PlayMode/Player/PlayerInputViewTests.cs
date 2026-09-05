using System.Collections;
using System.Collections.Generic;
using System.Linq;
using CleanArchitecture.Core.Installer;
using CleanArchitecture.Player.Presentation;
using R3;
using VContainer;
using CleanArchitecture.Player.View;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace CleanArchitecture.Player.Tests.PlayMode
{
    public sealed class PlayerInputViewTests
    {
        private GameObject _object;
        private PlayerInputView _view;
        private InputActionAsset _actions;
        private Keyboard _keyboard;
        private CapturingCommands _commands;
        private float _timeScale;
        private InputSettings _originalSettings;
        private InputSettings _testSettings;
        private int _jumpEdges;
        private bool _runInBackground;

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            yield return SceneManager.LoadSceneAsync("ArchitectureSandbox", LoadSceneMode.Single);
            Object.FindFirstObjectByType<PlayerInputView>().enabled = false;
            _timeScale = Time.timeScale;
            _runInBackground = UnityEngine.Application.runInBackground;
            UnityEngine.Application.runInBackground = true;
            // 합성 입력이 Editor 포커스에 의해 폐기되지 않도록 테스트 복제본만 사용한다.
            _originalSettings = InputSystem.settings;
            _testSettings = Object.Instantiate(_originalSettings);
            _testSettings.backgroundBehavior = InputSettings.BackgroundBehavior.IgnoreFocus;
            _testSettings.editorInputBehaviorInPlayMode = InputSettings.EditorInputBehaviorInPlayMode.AllDeviceInputAlwaysGoesToGameView;
            InputSystem.settings = _testSettings;
            _keyboard = InputSystem.AddDevice<Keyboard>();
            _actions = ScriptableObject.CreateInstance<InputActionAsset>();
            var map = _actions.AddActionMap("Player");
            map.AddAction("Move", InputActionType.Value).AddCompositeBinding("2DVector")
                .With("Left", "<Keyboard>/a").With("Right", "<Keyboard>/d");
            _jumpEdges = 0;
            map.AddAction("Jump", InputActionType.Button, "<Keyboard>/space").performed += _ => _jumpEdges++;
            _actions.devices = new InputDevice[] { _keyboard };
            _object = new GameObject("Input adapter test");
            _object.SetActive(false);
            _view = _object.AddComponent<PlayerInputView>();
            _view.Configure(_actions);
            _commands = new CapturingCommands();
            _view.Initialize(_commands);
            _object.SetActive(true);
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            Time.timeScale = _timeScale;
            UnityEngine.Application.runInBackground = _runInBackground;
            Object.Destroy(_object);
            yield return null;
            InputSystem.RemoveDevice(_keyboard);
            InputSystem.settings = _originalSettings;
            Object.Destroy(_testSettings);
            Object.Destroy(_actions);
        }

        [UnityTest]
        public IEnumerator DynamicInput_IsQueuedUntilPhysicsAndJumpIsConsumedOnce()
        {
            Time.timeScale = 0f;
            _commands.Calls.Clear();
            InputSystem.QueueStateEvent(_keyboard, new KeyboardState(Key.D, Key.Space));
            yield return null;
            yield return null;
            AssertInputReceived();
            Assert.That(_commands.Calls, Is.Empty, "물리 틱 전에는 입력 명령을 전달하지 않는다.");
            Time.timeScale = _timeScale;
            yield return new WaitForFixedUpdate();
            yield return new WaitForFixedUpdate();
            yield return null;
            Assert.That(_commands.Calls.Count, Is.GreaterThanOrEqualTo(2));
            Assert.That(_commands.Calls.Count(call => call.Jump), Is.EqualTo(1));
            Assert.That(_commands.Calls.All(call => call.Horizontal == 1f), Is.True);
            Assert.That(_commands.Calls.All(call => Mathf.Approximately(call.DeltaTime, Time.fixedDeltaTime)), Is.True);

            InputSystem.QueueStateEvent(_keyboard, new KeyboardState(Key.A));
            yield return null;
            yield return new WaitForFixedUpdate();
            yield return new WaitForFixedUpdate();
            Assert.That(_commands.Calls.Last().Horizontal, Is.EqualTo(-1f));
        }

        [UnityTest]
        public IEnumerator Disable_ClearsQueuedJumpAndHeldDirectionBeforeReenable()
        {
            Time.timeScale = 0f;
            _commands.Calls.Clear();
            InputSystem.QueueStateEvent(_keyboard, new KeyboardState(Key.D, Key.Space));
            yield return null;
            yield return null;
            AssertInputReceived();
            _view.enabled = false;
            InputSystem.QueueStateEvent(_keyboard, new KeyboardState());
            yield return null;
            _view.enabled = true;
            yield return null;
            Time.timeScale = _timeScale;
            yield return new WaitForFixedUpdate();
            yield return new WaitForFixedUpdate();
            Assert.That(_commands.Calls, Is.Not.Empty);
            Assert.That(_commands.Calls.All(call => !call.Jump && call.Horizontal == 0f), Is.True);
        }

        [UnityTest]
        public IEnumerator SceneKeyboardJump_DrivesPhysicsSemanticStatesAndLandingAnimation()
        {
            _view.enabled = false;
            var player = GameObject.Find("Player");
            player.GetComponent<PlayerInputView>().enabled = true;
            var body = player.GetComponent<Rigidbody2D>();
            var animator = player.transform.Find("Visual").GetComponent<Animator>();
            var presenter = Object.FindFirstObjectByType<GameLifetimeScope>().Container.Resolve<PlayerPresenter>();
            var expressions = new HashSet<PlayerLocomotion>();
            var animations = new HashSet<string>();
            using var subscription = presenter.ViewStates.Subscribe(state => expressions.Add(state.Locomotion));
            for (var i = 0; i < 10; i++) yield return new WaitForFixedUpdate();
            // 기본 시작점 X=-5는 Left Platform 아래다. 기존 두 플랫폼 사이 빈 지면에서 점프한다.
            body.position = new Vector2(-1.5f, body.position.y);
            for (var i = 0; i < 5; i++) yield return new WaitForFixedUpdate();
            var startY = body.position.y;
            var maxY = startY;
            var maxVelocity = 0f;
            InputSystem.QueueStateEvent(_keyboard, new KeyboardState(Key.Space));
            yield return null;
            yield return null;
            InputSystem.QueueStateEvent(_keyboard, new KeyboardState());
            for (var i = 0; i < 100; i++)
            {
                yield return new WaitForFixedUpdate();
                maxY = Mathf.Max(maxY, body.position.y);
                maxVelocity = Mathf.Max(maxVelocity, body.linearVelocity.y);
                foreach (var name in new[] { "Jump", "Fall", "Land", "Idle" })
                    if (animator.GetCurrentAnimatorStateInfo(0).IsName("Base Layer." + name)) animations.Add(name);
            }
            Assert.That(maxY, Is.GreaterThan(startY + 0.5f));
            Assert.That(maxVelocity, Is.GreaterThan(5f));
            Assert.That(body.position.y, Is.EqualTo(startY).Within(0.03f));
            Assert.That(expressions, Does.Contain(PlayerLocomotion.Jump));
            Assert.That(expressions, Does.Contain(PlayerLocomotion.Fall));
            Assert.That(animations, Is.SupersetOf(new[] { "Jump", "Fall", "Land", "Idle" }));
            TestContext.WriteLine($"Space input: Y {startY} -> {maxY} -> {body.position.y}, max velocity {maxVelocity}");
        }

        private void AssertInputReceived()
        {
            Assert.That(_jumpEdges, Is.EqualTo(1), "Input System이 실제 press edge를 받아야 한다.");
            Assert.That(_actions.FindAction("Player/Move").ReadValue<Vector2>().x, Is.EqualTo(1f));
        }

        private sealed class CapturingCommands : IPlayerInputCommands
        {
            public readonly List<Call> Calls = new List<Call>();
            public void UpdateMotion(float horizontalInput, bool jumpPressed, float deltaTime) =>
                Calls.Add(new Call { Horizontal = horizontalInput, Jump = jumpPressed, DeltaTime = deltaTime });
        }

        private struct Call
        {
            public float Horizontal;
            public bool Jump;
            public float DeltaTime;
        }
    }
}
