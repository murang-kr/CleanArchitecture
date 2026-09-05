namespace CleanArchitecture.Player.Presentation
{
    public interface IPlayerInputCommands
    {
        void UpdateMotion(float horizontalInput, bool jumpPressed, float deltaTime);
    }
}
