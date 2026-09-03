using System;
using CleanArchitecture.Player.Domain;
using NUnit.Framework;

namespace CleanArchitecture.Player.Tests.EditMode
{
    public sealed class PlayerMotionRulesTests
    {
        private static readonly PlayerMotionConfig Config =
            new PlayerMotionConfig(7f, 40f, 50f, 11f);

        [Test]
        public void Decide_ClampsInputAndMaximumSpeed()
        {
            var rules = new PlayerMotionRules();
            var state = new PlayerMotionState(6f, 0f, true);

            var result = rules.Decide(
                state,
                new PlayerMotionIntent(2f, false),
                Config,
                1f);

            Assert.That(result.HorizontalVelocity, Is.EqualTo(7f));
        }

        [Test]
        public void Decide_UsesAccelerationWhileInputIsHeld()
        {
            var rules = new PlayerMotionRules();

            var result = rules.Decide(
                new PlayerMotionState(0f, 0f, true),
                new PlayerMotionIntent(1f, false),
                Config,
                0.1f);

            Assert.That(result.HorizontalVelocity, Is.EqualTo(4f));
        }

        [Test]
        public void Decide_UsesDecelerationWhenInputIsReleased()
        {
            var rules = new PlayerMotionRules();

            var result = rules.Decide(
                new PlayerMotionState(6f, 0f, true),
                new PlayerMotionIntent(0f, false),
                Config,
                0.1f);

            Assert.That(result.HorizontalVelocity, Is.EqualTo(1f));
        }

        [TestCase(true, true)]
        [TestCase(false, false)]
        public void Decide_OnlyJumpsWhileGrounded(bool isGrounded, bool expectedJump)
        {
            var rules = new PlayerMotionRules();

            var result = rules.Decide(
                new PlayerMotionState(0f, -3f, isGrounded),
                new PlayerMotionIntent(0f, true),
                Config,
                0.02f);

            Assert.That(result.ShouldJump, Is.EqualTo(expectedJump));
            Assert.That(result.VerticalVelocity, Is.EqualTo(expectedJump ? 11f : -3f));
        }

        [Test]
        public void Decide_RejectsNegativeDeltaTime()
        {
            var rules = new PlayerMotionRules();

            Assert.Throws<ArgumentOutOfRangeException>(() => rules.Decide(
                new PlayerMotionState(),
                new PlayerMotionIntent(),
                Config,
                -0.01f));
        }
    }
}
