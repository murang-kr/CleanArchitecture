using System;

namespace CleanArchitecture.Player.Domain
{
    public sealed class PlayerMotionRules
    {
        private const float InputDeadZone = 0.0001f;

        public PlayerMotionDecision Decide(
            PlayerMotionState state,
            PlayerMotionIntent intent,
            PlayerMotionConfig config,
            float deltaTime)
        {
            Validate(config, deltaTime);

            var horizontalInput = Clamp(intent.HorizontalInput, -1f, 1f);
            var targetVelocity = horizontalInput * config.MaximumSpeed;
            var rate = Math.Abs(horizontalInput) > InputDeadZone
                ? config.Acceleration
                : config.Deceleration;
            var horizontalVelocity = MoveTowards(
                state.HorizontalVelocity,
                targetVelocity,
                rate * deltaTime);
            var shouldJump = intent.JumpRequested && state.IsGrounded;
            var verticalVelocity = shouldJump ? config.JumpSpeed : state.VerticalVelocity;

            return new PlayerMotionDecision(horizontalVelocity, verticalVelocity, shouldJump);
        }

        private static void Validate(PlayerMotionConfig config, float deltaTime)
        {
            if (deltaTime < 0f)
            {
                throw new ArgumentOutOfRangeException(nameof(deltaTime));
            }

            if (config.MaximumSpeed < 0f ||
                config.Acceleration < 0f ||
                config.Deceleration < 0f ||
                config.JumpSpeed < 0f)
            {
                throw new ArgumentOutOfRangeException(nameof(config));
            }
        }

        private static float Clamp(float value, float minimum, float maximum)
        {
            return Math.Max(minimum, Math.Min(maximum, value));
        }

        private static float MoveTowards(float current, float target, float maximumDelta)
        {
            if (Math.Abs(target - current) <= maximumDelta)
            {
                return target;
            }

            return current + Math.Sign(target - current) * maximumDelta;
        }
    }
}
