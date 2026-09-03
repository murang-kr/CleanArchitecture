using CleanArchitecture.Player.Domain;

namespace CleanArchitecture.Player.Application
{
    public interface IPlayerMotor
    {
        PlayerMotionState ReadState();

        void Apply(PlayerMotionDecision decision);
    }

    public interface IPlayerMotionSettings
    {
        PlayerMotionConfig MotionConfig { get; }
    }
}
