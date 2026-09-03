using System.Collections;
using CleanArchitecture.Core.Installer;
using CleanArchitecture.Player.Infrastructure;
using CleanArchitecture.Player.Presentation;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using VContainer;

namespace CleanArchitecture.Player.Tests.PlayMode
{
    public sealed class PlayerMovementSmokeTests
    {
        [UnityTest]
        public IEnumerator ArchitectureSandbox_LoadsAndBuildsPlayerComposition()
        {
            yield return SceneManager.LoadSceneAsync("ArchitectureSandbox", LoadSceneMode.Single);

            var scope = Object.FindFirstObjectByType<GameLifetimeScope>();
            var motor = Object.FindFirstObjectByType<Rigidbody2DPlayerMotor>();
            var player = GameObject.Find("Player");

            Assert.That(scope, Is.Not.Null);
            Assert.That(scope.Container, Is.Not.Null);
            Assert.That(motor, Is.Not.Null);
            Assert.That(player, Is.Not.Null);

            var body = player.GetComponent<Rigidbody2D>();
            Assert.That(body, Is.Not.Null);

            var timeout = Time.time + 2f;
            while (!motor.ReadState().IsGrounded && Time.time < timeout)
            {
                yield return new WaitForFixedUpdate();
            }

            Assert.That(motor.ReadState().IsGrounded, Is.True);
            Assert.That(body.linearVelocity.y, Is.EqualTo(0f).Within(0.05f));
            Assert.That(player.transform.position.y, Is.EqualTo(-1.4f).Within(0.1f));

            var groundedHeight = player.transform.position.y;
            var presenter = scope.Container.Resolve<PlayerPresenter>();
            presenter.UpdateMotion(0f, true, Time.fixedDeltaTime);

            Assert.That(body.linearVelocity.y, Is.EqualTo(11f).Within(0.01f));

            var leaveGroundTimeout = Time.time + 0.5f;
            while (motor.ReadState().IsGrounded && Time.time < leaveGroundTimeout)
            {
                yield return new WaitForFixedUpdate();
            }

            Assert.That(motor.ReadState().IsGrounded, Is.False);
            Assert.That(player.transform.position.y, Is.GreaterThan(groundedHeight));
        }
    }
}
