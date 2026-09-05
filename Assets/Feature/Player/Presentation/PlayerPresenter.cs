using System;
using CleanArchitecture.Player.Application;
using R3;

namespace CleanArchitecture.Player.Presentation
{
    public sealed class PlayerPresenter : IPlayerInputCommands, IDisposable
    {
        private const float DirectionDeadZone = 0.0001f;
        private const float RunThreshold = 0.05f;
        private const float JumpThreshold = 0.01f;

        private readonly UpdatePlayerMotionUseCase _updatePlayerMotion;
        private readonly ReactiveProperty<PlayerViewState> _viewState =
            new ReactiveProperty<PlayerViewState>(new PlayerViewState(PlayerLocomotion.Idle, 1));
        private readonly Subject<Unit> _landed = new Subject<Unit>();
        private bool _hasMotionSample;
        private bool _wasGrounded;
        private bool _disposed;

        public PlayerPresenter(UpdatePlayerMotionUseCase updatePlayerMotion)
        {
            _updatePlayerMotion = updatePlayerMotion ?? throw new ArgumentNullException(nameof(updatePlayerMotion));
            ViewStates = _viewState.AsObservable();
            Landed = _landed.AsObservable();
        }

        public Observable<PlayerViewState> ViewStates { get; }
        public Observable<Unit> Landed { get; }

        public void UpdateMotion(float horizontalInput, bool jumpPressed, float deltaTime)
        {
            if (_disposed) throw new ObjectDisposedException(nameof(PlayerPresenter));

            var result = _updatePlayerMotion.Execute(
                new PlayerMotionInput(horizontalInput, jumpPressed), deltaTime);
            var current = _viewState.Value;
            var justLanded = _hasMotionSample && !_wasGrounded && result.IsGrounded;
            _hasMotionSample = true;
            _wasGrounded = result.IsGrounded;

            // 출력을 먼저 갱신해야 착지 클립 종료 시 최신 지상 표현으로 복귀한다.
            _viewState.Value = new PlayerViewState(
                ResolveLocomotion(result, current.Locomotion),
                ResolveFacingDirection(horizontalInput, current.FacingDirection));
            if (justLanded && !_disposed)
            {
                _landed.OnNext(Unit.Default);
            }
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _viewState.Dispose();
            _landed.Dispose();
        }

        private static PlayerLocomotion ResolveLocomotion(PlayerMotionResult result, PlayerLocomotion current)
        {
            if (result.IsGrounded)
            {
                var speed = Math.Abs(result.HorizontalVelocity);
                if (speed > RunThreshold) return PlayerLocomotion.Run;
                if (speed < RunThreshold) return PlayerLocomotion.Idle;
                return current == PlayerLocomotion.Run ? PlayerLocomotion.Run : PlayerLocomotion.Idle;
            }

            if (result.VerticalVelocity > JumpThreshold) return PlayerLocomotion.Jump;
            if (result.VerticalVelocity < JumpThreshold) return PlayerLocomotion.Fall;
            return current == PlayerLocomotion.Jump ? PlayerLocomotion.Jump : PlayerLocomotion.Fall;
        }

        private static int ResolveFacingDirection(float horizontalInput, int currentDirection)
        {
            if (horizontalInput > DirectionDeadZone) return 1;
            if (horizontalInput < -DirectionDeadZone) return -1;
            return currentDirection;
        }
    }
}
