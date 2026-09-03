using System;
using CleanArchitecture.Player.Infrastructure;
using CleanArchitecture.Player.Installer;
using CleanArchitecture.Player.View;
using UnityEngine;
using VContainer;
using VContainer.Unity;

namespace CleanArchitecture.Core.Installer
{
    public sealed class GameLifetimeScope : LifetimeScope
    {
        [Header("Player")]
        [SerializeField] private PlayerMovementSettings playerMovementSettings;
        [SerializeField] private Rigidbody2DPlayerMotor playerMotor;
        [SerializeField] private PlayerInputView playerInputView;
        [SerializeField] private PlayerVisualView playerVisualView;

        public void ConfigureScene(
            PlayerMovementSettings settings,
            Rigidbody2DPlayerMotor motor,
            PlayerInputView inputView,
            PlayerVisualView visualView)
        {
            playerMovementSettings = settings;
            playerMotor = motor;
            playerInputView = inputView;
            playerVisualView = visualView;
        }

        protected override void Configure(IContainerBuilder builder)
        {
            ValidateSceneReferences();
            new PlayerInstaller(
                playerMovementSettings,
                playerMotor,
                playerInputView,
                playerVisualView).Install(builder);
        }

        private void ValidateSceneReferences()
        {
            if (playerMovementSettings == null ||
                playerMotor == null ||
                playerInputView == null ||
                playerVisualView == null)
            {
                throw new InvalidOperationException(
                    "GameLifetimeScope requires all Player scene references before building the container.");
            }
        }
    }
}
