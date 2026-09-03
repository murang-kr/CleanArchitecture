using CleanArchitecture.Player.Domain;

namespace CleanArchitecture.Player.Application
{
    public readonly struct PlayerMotionInput
    {
        public PlayerMotionInput(float horizontal, bool jumpPressed)
        {
            Horizontal = horizontal;
            JumpPressed = jumpPressed;
        }

        public float Horizontal { get; }

        public bool JumpPressed { get; }
    }

    public readonly struct PlayerMotionResult
    {
        public PlayerMotionResult(float horizontalVelocity, float verticalVelocity, bool isGrounded)
        {
            HorizontalVelocity = horizontalVelocity;
            VerticalVelocity = verticalVelocity;
            IsGrounded = isGrounded;
        }

        public float HorizontalVelocity { get; }

        public float VerticalVelocity { get; }

        public bool IsGrounded { get; }
    }

    public sealed class UpdatePlayerMotionUseCase
    {
        private readonly PlayerMotionRules _rules;
        private readonly IPlayerMotor _motor;
        private readonly IPlayerMotionSettings _settings;

        public UpdatePlayerMotionUseCase(
            PlayerMotionRules rules,
            IPlayerMotor motor,
            IPlayerMotionSettings settings)
        {
            _rules = rules;
            _motor = motor;
            _settings = settings;
        }

        public PlayerMotionResult Execute(PlayerMotionInput input, float deltaTime)
        {
            var currentState = _motor.ReadState();
            var intent = new PlayerMotionIntent(input.Horizontal, input.JumpPressed);
            var decision = _rules.Decide(currentState, intent, _settings.MotionConfig, deltaTime);

            _motor.Apply(decision);

            return new PlayerMotionResult(
                decision.HorizontalVelocity,
                decision.VerticalVelocity,
                decision.ShouldJump ? false : currentState.IsGrounded);
        }
    }
}
