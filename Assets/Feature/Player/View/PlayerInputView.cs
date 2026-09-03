using CleanArchitecture.Player.Presentation;
using UnityEngine;
using UnityEngine.InputSystem;

namespace CleanArchitecture.Player.View
{
    public sealed class PlayerInputView : MonoBehaviour
    {
        [SerializeField] private InputActionAsset inputActions;
        [SerializeField] private string moveActionPath = "Player/Move";
        [SerializeField] private string jumpActionPath = "Player/Jump";

        private PlayerPresenter _presenter;
        private InputAction _moveAction;
        private InputAction _jumpAction;
        private float _horizontalInput;
        private bool _jumpQueued;

        public void Configure(InputActionAsset targetInputActions)
        {
            inputActions = targetInputActions;
            ResolveActions();
        }

        public void Initialize(PlayerPresenter presenter)
        {
            _presenter = presenter;
        }

        private void Awake()
        {
            ResolveActions();
        }

        private void OnEnable()
        {
            ResolveActions();
            _moveAction?.Enable();
            _jumpAction?.Enable();
        }

        private void OnDisable()
        {
            _moveAction?.Disable();
            _jumpAction?.Disable();
            _horizontalInput = 0f;
            _jumpQueued = false;
        }

        private void Update()
        {
            if (_moveAction == null || _jumpAction == null)
            {
                return;
            }

            _horizontalInput = _moveAction.ReadValue<Vector2>().x;
            _jumpQueued |= _jumpAction.WasPressedThisFrame();
        }

        private void FixedUpdate()
        {
            if (_presenter == null)
            {
                return;
            }

            _presenter.UpdateMotion(_horizontalInput, _jumpQueued, Time.fixedDeltaTime);
            _jumpQueued = false;
        }

        private void ResolveActions()
        {
            if (inputActions == null)
            {
                return;
            }

            _moveAction = inputActions.FindAction(moveActionPath, true);
            _jumpAction = inputActions.FindAction(jumpActionPath, true);
        }
    }
}
