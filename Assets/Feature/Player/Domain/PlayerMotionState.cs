namespace CleanArchitecture.Player.Domain
{
    public readonly struct PlayerMotionState
    {
        public PlayerMotionState(float horizontalVelocity, float verticalVelocity, bool isGrounded)
        {
            HorizontalVelocity = horizontalVelocity;
            VerticalVelocity = verticalVelocity;
            IsGrounded = isGrounded;
        }

        public float HorizontalVelocity { get; }

        public float VerticalVelocity { get; }

        public bool IsGrounded { get; }
    }

    public readonly struct PlayerMotionIntent
    {
        public PlayerMotionIntent(float horizontalInput, bool jumpRequested)
        {
            HorizontalInput = horizontalInput;
            JumpRequested = jumpRequested;
        }

        public float HorizontalInput { get; }

        public bool JumpRequested { get; }
    }

    public readonly struct PlayerMotionConfig
    {
        public PlayerMotionConfig(float maximumSpeed, float acceleration, float deceleration, float jumpSpeed)
        {
            MaximumSpeed = maximumSpeed;
            Acceleration = acceleration;
            Deceleration = deceleration;
            JumpSpeed = jumpSpeed;
        }

        public float MaximumSpeed { get; }

        public float Acceleration { get; }

        public float Deceleration { get; }

        public float JumpSpeed { get; }
    }

    public readonly struct PlayerMotionDecision
    {
        public PlayerMotionDecision(float horizontalVelocity, float verticalVelocity, bool shouldJump)
        {
            HorizontalVelocity = horizontalVelocity;
            VerticalVelocity = verticalVelocity;
            ShouldJump = shouldJump;
        }

        public float HorizontalVelocity { get; }

        public float VerticalVelocity { get; }

        public bool ShouldJump { get; }
    }
}
