using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using UnityEngine;

namespace CleanArchitecture.Player.Infrastructure
{
    [CreateAssetMenu(fileName = "PlayerMovementSettings", menuName = "Clean Architecture/Player/Movement Settings")]
    public sealed class PlayerMovementSettings : ScriptableObject, IPlayerMotionSettings
    {
        [SerializeField, Min(0f)] private float maximumSpeed = 7f;
        [SerializeField, Min(0f)] private float acceleration = 45f;
        [SerializeField, Min(0f)] private float deceleration = 55f;
        [SerializeField, Min(0f)] private float jumpSpeed = 11f;

        public PlayerMotionConfig MotionConfig =>
            new PlayerMotionConfig(maximumSpeed, acceleration, deceleration, jumpSpeed);
    }
}
