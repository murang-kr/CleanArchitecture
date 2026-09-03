using CleanArchitecture.Player.Presentation;
using UnityEngine;

namespace CleanArchitecture.Player.View
{
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class PlayerVisualView : MonoBehaviour
    {
        private static Sprite _placeholderSprite;

        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Color groundedColor = new Color(0.12f, 0.82f, 0.92f, 1f);
        [SerializeField] private Color airborneColor = new Color(1f, 0.78f, 0.18f, 1f);

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
            spriteRenderer.color = state.IsGrounded ? groundedColor : airborneColor;
        }

        private void EnsureRenderer()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }

            if (spriteRenderer.sprite == null)
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
