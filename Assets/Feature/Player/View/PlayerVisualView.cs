using CleanArchitecture.Player.Presentation;
using UnityEngine;

namespace CleanArchitecture.Player.View
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Animator))]
    public sealed class PlayerVisualView : MonoBehaviour
    {
        private static readonly int HorizontalSpeedHash = Animator.StringToHash("HorizontalSpeed");
        private static readonly int VerticalSpeedHash = Animator.StringToHash("VerticalSpeed");
        private static readonly int IsGroundedHash = Animator.StringToHash("IsGrounded");
        private static readonly int LandHash = Animator.StringToHash("Land");
        private static Sprite _placeholderSprite;

        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Animator animator;

        private PlayerPresenter _presenter;

        public void Configure(SpriteRenderer targetRenderer)
        {
            spriteRenderer = targetRenderer;
            EnsureRenderer();
        }

        public void Initialize(PlayerPresenter presenter)
        {
            if (_presenter != null)
            {
                _presenter.ViewStateChanged -= Render;
            }

            _presenter = presenter;
            _presenter.ViewStateChanged += Render;
            Render(_presenter.ViewState);
        }

        private void Awake()
        {
            EnsureRenderer();
        }

        private void OnDestroy()
        {
            if (_presenter != null)
            {
                _presenter.ViewStateChanged -= Render;
            }
        }

        private void Render(PlayerViewState state)
        {
            EnsureRenderer();
            spriteRenderer.flipX = state.FacingDirection < 0;
            spriteRenderer.color = Color.white;

            if (animator == null || animator.runtimeAnimatorController == null)
            {
                return;
            }

            animator.SetFloat(HorizontalSpeedHash, Mathf.Abs(state.HorizontalSpeed));
            animator.SetFloat(VerticalSpeedHash, state.VerticalSpeed);
            animator.SetBool(IsGroundedHash, state.IsGrounded);

            if (state.JustLanded)
            {
                animator.SetTrigger(LandHash);
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
