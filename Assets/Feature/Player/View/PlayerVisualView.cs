using System;
using CleanArchitecture.Player.Presentation;
using R3;
using UnityEngine;

namespace CleanArchitecture.Player.View
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Animator))]
    public sealed class PlayerVisualView : MonoBehaviour
    {
        private static readonly int LocomotionHash = Animator.StringToHash("Locomotion");
        private static readonly int IdleHash = Animator.StringToHash("Base Layer.Idle");
        private static readonly int RunHash = Animator.StringToHash("Base Layer.Run");
        private static readonly int JumpHash = Animator.StringToHash("Base Layer.Jump");
        private static readonly int FallHash = Animator.StringToHash("Base Layer.Fall");
        private static readonly int LandHash = Animator.StringToHash("Land");
        private static Sprite _placeholderSprite;

        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Animator animator;

        private Observable<PlayerViewState> _viewStates;
        private Observable<Unit> _landed;
        private IDisposable _stateSubscription;
        private IDisposable _landingSubscription;
        private bool _synchronizeNextState;
        private bool _sourceCompleted;

        public void Configure(SpriteRenderer targetRenderer)
        {
            spriteRenderer = targetRenderer;
            EnsureRenderer();
        }

        public void Initialize(Observable<PlayerViewState> viewStates, Observable<Unit> landed)
        {
            if (viewStates == null) throw new ArgumentNullException(nameof(viewStates));
            if (landed == null) throw new ArgumentNullException(nameof(landed));
            Unsubscribe();
            _viewStates = viewStates;
            _landed = landed;
            _sourceCompleted = false;
            SubscribeWhenActive();
        }

        private void Awake() => EnsureRenderer();
        private void OnEnable() => SubscribeWhenActive();
        private void OnDisable() => Unsubscribe();

        private void OnDestroy()
        {
            Unsubscribe();
            _viewStates = null;
            _landed = null;
        }

        private void SubscribeWhenActive()
        {
            if (!isActiveAndEnabled || _viewStates == null || _sourceCompleted || _stateSubscription != null)
            {
                return;
            }

            _synchronizeNextState = true;
            try
            {
                _stateSubscription = _viewStates.Subscribe(Render, _ => OnSourceCompleted());
                if (_sourceCompleted || !isActiveAndEnabled)
                {
                    Unsubscribe();
                    return;
                }
                _landingSubscription = _landed.Subscribe(RenderLanding, _ => OnSourceCompleted());
            }
            catch (ObjectDisposedException)
            {
                // 비활성화 중에는 완료 알림도 받지 않는다. 그동안 종료된 소스는 다시 연결하지 않는다.
                OnSourceCompleted();
            }
        }

        private void OnSourceCompleted()
        {
            _sourceCompleted = true;
            Unsubscribe();
        }

        private void Unsubscribe()
        {
            _stateSubscription?.Dispose();
            _landingSubscription?.Dispose();
            _stateSubscription = null;
            _landingSubscription = null;
            if (HasAnimator()) animator.ResetTrigger(LandHash);
        }

        private void Render(PlayerViewState state)
        {
            EnsureRenderer();
            spriteRenderer.flipX = state.FacingDirection < 0;
            spriteRenderer.color = Color.white;
            if (!HasAnimator()) return;

            animator.SetInteger(LocomotionHash, (int)state.Locomotion);
            if (_synchronizeNextState)
            {
                // 재구독은 현재 지속 표현만 복원한다. 지나간 착지나 중단된 클립은 재생하지 않는다.
                animator.ResetTrigger(LandHash);
                animator.Play(GetStateHash(state.Locomotion), 0, 0f);
                _synchronizeNextState = false;
            }
            else if (state.Locomotion == PlayerLocomotion.Jump || state.Locomotion == PlayerLocomotion.Fall)
            {
                // Animator가 평가되기 전에 공중 상태가 도착해도 이전 착지 trigger를 남기지 않는다.
                animator.ResetTrigger(LandHash);
            }
        }

        private void RenderLanding(Unit _)
        {
            if (!HasAnimator()) return;
            animator.ResetTrigger(LandHash);
            animator.SetTrigger(LandHash);
        }

        private bool HasAnimator() => animator != null && animator.runtimeAnimatorController != null;

        private static int GetStateHash(PlayerLocomotion locomotion)
        {
            switch (locomotion)
            {
                case PlayerLocomotion.Idle: return IdleHash;
                case PlayerLocomotion.Run: return RunHash;
                case PlayerLocomotion.Jump: return JumpHash;
                case PlayerLocomotion.Fall: return FallHash;
                default: throw new ArgumentOutOfRangeException(nameof(locomotion));
            }
        }

        private void EnsureRenderer()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }

            if (animator == null)
            {
                animator = GetComponent<Animator>();
            }

            if (spriteRenderer.sprite == null &&
                (animator == null || animator.runtimeAnimatorController == null))
            {
                spriteRenderer.sprite = GetPlaceholderSprite();
            }
        }

        private static Sprite GetPlaceholderSprite()
        {
            if (_placeholderSprite == null)
            {
                var texture = Texture2D.whiteTexture;
                _placeholderSprite = Sprite.Create(
                    texture,
                    new Rect(0f, 0f, texture.width, texture.height),
                    new Vector2(0.5f, 0.5f),
                    texture.width);
                _placeholderSprite.name = "Runtime Player Placeholder";
            }

            return _placeholderSprite;
        }
    }
}
