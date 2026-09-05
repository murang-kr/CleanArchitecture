using System.Collections.Generic;
using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using CleanArchitecture.Player.Presentation;
using NUnit.Framework;

namespace CleanArchitecture.Player.Tests.EditMode
{
    public sealed class PlayerPresenterTests
    {
        [Test]
        public void UpdateMotion_EmitsJustLandedOnceForAirborneToGroundedTransition()
        {
            var motor = new SequenceMotor(
                new PlayerMotionState(0f, -1f, false),
                new PlayerMotionState(0f, 0f, true),
                new PlayerMotionState(0f, 0f, true));
            var settings = new StubSettings(new PlayerMotionConfig(8f, 20f, 30f, 11f));
            var presenter = new PlayerPresenter(
                new UpdatePlayerMotionUseCase(new PlayerMotionRules(), motor, settings));

            presenter.UpdateMotion(0f, false, 0.02f);
            Assert.That(presenter.ViewState.JustLanded, Is.False);

            presenter.UpdateMotion(0f, false, 0.02f);
            Assert.That(presenter.ViewState.JustLanded, Is.True);

            presenter.UpdateMotion(0f, false, 0.02f);
            Assert.That(presenter.ViewState.JustLanded, Is.False);
        }

        private sealed class SequenceMotor : IPlayerMotor
        {
            private readonly Queue<PlayerMotionState> _states;

            public SequenceMotor(params PlayerMotionState[] states)
            {
                _states = new Queue<PlayerMotionState>(states);
            }

            public PlayerMotionState ReadState()
            {
                return _states.Dequeue();
            }

            public void Apply(PlayerMotionDecision decision)
            {
            }
        }

        private sealed class StubSettings : IPlayerMotionSettings
        {
            public StubSettings(PlayerMotionConfig motionConfig)
            {
                MotionConfig = motionConfig;
            }

            public PlayerMotionConfig MotionConfig { get; }
        }
    }
}
