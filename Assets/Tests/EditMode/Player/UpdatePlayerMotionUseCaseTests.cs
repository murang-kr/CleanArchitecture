using CleanArchitecture.Player.Application;
using CleanArchitecture.Player.Domain;
using NUnit.Framework;

namespace CleanArchitecture.Player.Tests.EditMode
{
    public sealed class UpdatePlayerMotionUseCaseTests
    {
        [Test]
        public void Execute_AppliesDomainDecisionToMotor()
        {
            var motor = new RecordingMotor(new PlayerMotionState(0f, 0f, true));
            var settings = new StubSettings(new PlayerMotionConfig(8f, 20f, 30f, 12f));
            var useCase = new UpdatePlayerMotionUseCase(new PlayerMotionRules(), motor, settings);

            var result = useCase.Execute(new PlayerMotionInput(1f, true), 0.1f);

            Assert.That(motor.ApplyCount, Is.EqualTo(1));
            Assert.That(motor.LastDecision.HorizontalVelocity, Is.EqualTo(2f));
            Assert.That(motor.LastDecision.VerticalVelocity, Is.EqualTo(12f));
            Assert.That(motor.LastDecision.ShouldJump, Is.True);
            Assert.That(result.IsGrounded, Is.False);
        }

        private sealed class RecordingMotor : IPlayerMotor
        {
            private readonly PlayerMotionState _state;

            public RecordingMotor(PlayerMotionState state)
            {
                _state = state;
            }

            public int ApplyCount { get; private set; }

            public PlayerMotionDecision LastDecision { get; private set; }

            public PlayerMotionState ReadState()
            {
                return _state;
            }

            public void Apply(PlayerMotionDecision decision)
            {
                ApplyCount++;
                LastDecision = decision;
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
