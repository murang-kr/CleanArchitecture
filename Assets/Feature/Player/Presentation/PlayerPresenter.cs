using System;
using CleanArchitecture.Player.Application;

namespace CleanArchitecture.Player.Presentation
{
    public sealed class PlayerPresenter
    {
        private const float DirectionDeadZone = 0.0001f;

        private readonly UpdatePlayerMotionUseCase _updatePlayerMotion;
        private PlayerViewState _viewState = new PlayerViewState(0f, 0f, false, false, 1);
        private bool _hasMotionSample;

        public PlayerPresenter(UpdatePlayerMotionUseCase updatePlayerMotion)
        {
            _updatePlayerMotion = updatePlayerMotion;
        }

        public event Action<PlayerViewState> ViewStateChanged;

        public PlayerViewState ViewState => _viewState;

        public void UpdateMotion(float horizontalInput, bool jumpPressed, float deltaTime)
        {
            var result = _updatePlayerMotion.Execute(
                new PlayerMotionInput(horizontalInput, jumpPressed),
                deltaTime);
            var facingDirection = ResolveFacingDirection(horizontalInput, _viewState.FacingDirection);
            var justLanded = _hasMotionSample && !_viewState.IsGrounded && result.IsGrounded;
            var nextState = new PlayerViewState(
                result.HorizontalVelocity,
                result.VerticalVelocity,
                result.IsGrounded,
                justLanded,
                facingDirection);
            _hasMotionSample = true;

            if (nextState.Equals(_viewState))
            {
                return;
            }

            _viewState = nextState;
            ViewStateChanged?.Invoke(_viewState);
        }

        private static int ResolveFacingDirection(float horizontalInput, int currentDirection)
        {
            if (horizontalInput > DirectionDeadZone)
            {
                return 1;
            }

            if (horizontalInput < -DirectionDeadZone)
            {
                return -1;
            }

            return currentDirection == 0 ? 1 : currentDirection;
        }
    }
}
