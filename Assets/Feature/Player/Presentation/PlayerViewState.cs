using System;

namespace CleanArchitecture.Player.Presentation
{
    public readonly struct PlayerViewState : IEquatable<PlayerViewState>
    {
        public PlayerViewState(
            float horizontalSpeed,
            float verticalSpeed,
            bool isGrounded,
            bool justLanded,
            int facingDirection)
        {
            HorizontalSpeed = horizontalSpeed;
            VerticalSpeed = verticalSpeed;
            IsGrounded = isGrounded;
            JustLanded = justLanded;
            FacingDirection = facingDirection;
        }

        public float HorizontalSpeed { get; }

        public float VerticalSpeed { get; }

        public bool IsGrounded { get; }

        public bool JustLanded { get; }

        public int FacingDirection { get; }

        public bool Equals(PlayerViewState other)
        {
            return HorizontalSpeed.Equals(other.HorizontalSpeed) &&
                   VerticalSpeed.Equals(other.VerticalSpeed) &&
                   IsGrounded == other.IsGrounded &&
                   JustLanded == other.JustLanded &&
                   FacingDirection == other.FacingDirection;
        }

        public override bool Equals(object obj)
        {
            return obj is PlayerViewState other && Equals(other);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                var hashCode = HorizontalSpeed.GetHashCode();
                hashCode = (hashCode * 397) ^ VerticalSpeed.GetHashCode();
                hashCode = (hashCode * 397) ^ IsGrounded.GetHashCode();
                hashCode = (hashCode * 397) ^ JustLanded.GetHashCode();
                hashCode = (hashCode * 397) ^ FacingDirection;
                return hashCode;
            }
        }
    }
}
