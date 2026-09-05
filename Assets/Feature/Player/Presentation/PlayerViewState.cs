using System;

namespace CleanArchitecture.Player.Presentation
{
    public enum PlayerLocomotion
    {
        Idle,
        Run,
        Jump,
        Fall
    }

    public readonly struct PlayerViewState : IEquatable<PlayerViewState>
    {
        public PlayerViewState(PlayerLocomotion locomotion, int facingDirection)
        {
            Locomotion = locomotion;
            FacingDirection = facingDirection;
        }

        public PlayerLocomotion Locomotion { get; }
        public int FacingDirection { get; }

        public bool Equals(PlayerViewState other)
        {
            return Locomotion == other.Locomotion && FacingDirection == other.FacingDirection;
        }

        public override bool Equals(object obj) => obj is PlayerViewState other && Equals(other);

        public override int GetHashCode()
        {
            unchecked
            {
                return ((int)Locomotion * 397) ^ FacingDirection;
            }
        }
    }
}
