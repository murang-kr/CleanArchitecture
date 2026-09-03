using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using UnityEngine;

namespace CleanArchitecture.Player.Infrastructure
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Collider2D))]
    public sealed class Rigidbody2DPlayerMotor : MonoBehaviour, IPlayerMotor
    {
        [SerializeField] private Rigidbody2D body;
        [SerializeField] private Collider2D bodyCollider;
        [SerializeField] private LayerMask groundLayers = 1;

        public void Configure(Rigidbody2D targetBody, Collider2D targetCollider, LayerMask targetGroundLayers)
        {
            body = targetBody;
            bodyCollider = targetCollider;
            groundLayers = targetGroundLayers;
        }

        public PlayerMotionState ReadState()
        {
            EnsureReferences();
            var velocity = body.linearVelocity;
            var isGrounded = bodyCollider.IsTouchingLayers(groundLayers);

            return new PlayerMotionState(velocity.x, velocity.y, isGrounded);
        }

        public void Apply(PlayerMotionDecision decision)
        {
            EnsureReferences();
            body.linearVelocity = new Vector2(decision.HorizontalVelocity, decision.VerticalVelocity);
        }

        private void Awake()
        {
            EnsureReferences();
        }

        private void Reset()
        {
            body = GetComponent<Rigidbody2D>();
            bodyCollider = GetComponent<Collider2D>();
        }

        private void EnsureReferences()
        {
            if (body == null)
            {
                body = GetComponent<Rigidbody2D>();
            }

            if (bodyCollider == null)
            {
                bodyCollider = GetComponent<Collider2D>();
            }
        }
    }
}
