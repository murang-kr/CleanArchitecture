using System;
using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using CleanArchitecture.Player.Infrastructure;
using CleanArchitecture.Player.Presentation;
using CleanArchitecture.Player.View;
using VContainer;
using VContainer.Unity;

namespace CleanArchitecture.Player.Installer
{
    public sealed class PlayerInstaller : IInstaller
    {
        private readonly PlayerMovementSettings _settings;
        private readonly Rigidbody2DPlayerMotor _motor;
        private readonly PlayerInputView _inputView;
        private readonly PlayerVisualView _visualView;

        public PlayerInstaller(
            PlayerMovementSettings settings,
            Rigidbody2DPlayerMotor motor,
            PlayerInputView inputView,
            PlayerVisualView visualView)
        {
            _settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _motor = motor ?? throw new ArgumentNullException(nameof(motor));
            _inputView = inputView ?? throw new ArgumentNullException(nameof(inputView));
            _visualView = visualView ?? throw new ArgumentNullException(nameof(visualView));
        }

        public void Install(IContainerBuilder builder)
        {
            builder.RegisterInstance<IPlayerMotionSettings>(_settings);
            builder.RegisterInstance<IPlayerMotor>(_motor);
            builder.Register<PlayerMotionRules>(Lifetime.Singleton);
            builder.Register<UpdatePlayerMotionUseCase>(Lifetime.Singleton);
            builder.Register<PlayerPresenter>(Lifetime.Singleton);
            builder.RegisterBuildCallback(container =>
            {
                var presenter = container.Resolve<PlayerPresenter>();
                _inputView.Initialize(presenter);
                _visualView.Initialize(presenter.ViewStates, presenter.Landed);
            });
        }
    }
}
