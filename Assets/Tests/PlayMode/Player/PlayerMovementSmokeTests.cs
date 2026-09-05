using System.Collections;
using System.Linq;
using CleanArchitecture.Core.Installer;
using CleanArchitecture.Player.Infrastructure;
using CleanArchitecture.Player.Presentation;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.Tilemaps;
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
            var environment = GameObject.Find("Environment");
            var tilemap = Object.FindFirstObjectByType<Tilemap>();
            var camera = Camera.main;
            var visual = player != null ? player.transform.Find("Visual") : null;

            Assert.That(scope, Is.Not.Null);
            Assert.That(scope.Container, Is.Not.Null);
            Assert.That(motor, Is.Not.Null);
            Assert.That(player, Is.Not.Null);
            Assert.That(environment, Is.Not.Null);
            Assert.That(tilemap, Is.Not.Null);
            Assert.That(camera, Is.Not.Null);
            Assert.That(visual, Is.Not.Null);

            var body = player.GetComponent<Rigidbody2D>();
            var spriteRenderer = visual.GetComponent<SpriteRenderer>();
            var animator = visual.GetComponent<Animator>();
            var visualView = visual.GetComponents<MonoBehaviour>()
                .SingleOrDefault(component =>
                    component.GetType().FullName == "CleanArchitecture.Player.View.PlayerVisualView");
            var pixelPerfectCamera = camera.GetComponents<MonoBehaviour>()
                .SingleOrDefault(component =>
                    component.GetType().FullName ==
                    "UnityEngine.Rendering.Universal.PixelPerfectCamera");
            Assert.That(body, Is.Not.Null);
            Assert.That(spriteRenderer, Is.Not.Null);
            Assert.That(animator, Is.Not.Null);
            Assert.That(visualView, Is.Not.Null);
            Assert.That(pixelPerfectCamera, Is.Not.Null);
            Assert.That(animator.runtimeAnimatorController, Is.Not.Null);
            Assert.That(player.GetComponent<SpriteRenderer>(), Is.Null);
            Assert.That(player.GetComponent<Animator>(), Is.Null);
            Assert.That(visual.localScale, Is.EqualTo(Vector3.one));
            Assert.That(visual.localPosition.y, Is.EqualTo(-0.0625f).Within(0.001f));

            var pixelPerfectType = pixelPerfectCamera.GetType();
            Assert.That(pixelPerfectType.GetProperty("assetsPPU")?.GetValue(pixelPerfectCamera),
                Is.EqualTo(32));
            Assert.That(pixelPerfectType.GetProperty("refResolutionX")?.GetValue(pixelPerfectCamera),
                Is.EqualTo(384));
            Assert.That(pixelPerfectType.GetProperty("refResolutionY")?.GetValue(pixelPerfectCamera),
                Is.EqualTo(216));
            Assert.That(pixelPerfectType.GetProperty("cropFrame")?.GetValue(pixelPerfectCamera)?.ToString(),
                Is.EqualTo("Windowbox"));
            Assert.That(pixelPerfectType.GetProperty("gridSnapping")?.GetValue(pixelPerfectCamera)?.ToString(),
                Is.EqualTo("UpscaleRenderTexture"));
            Assert.That(camera.orthographic, Is.True);

            // 부모 확대와 음수 Scale 반전까지 금지한다. 방향 전환은 SpriteRenderer.flipX로 처리한다.
            foreach (var root in player.scene.GetRootGameObjects())
            {
                foreach (var transform in root.GetComponentsInChildren<Transform>(true))
                {
                    Assert.That(transform.localScale, Is.EqualTo(Vector3.one), transform.name);
                    Assert.That(transform.lossyScale, Is.EqualTo(Vector3.one), transform.name);
                }
                foreach (var renderer in root.GetComponentsInChildren<SpriteRenderer>(true))
                {
                    Assert.That(renderer.sprite, Is.Not.Null, renderer.name);
                    Assert.That(renderer.sprite.pixelsPerUnit, Is.EqualTo(32f), renderer.name);
                    Assert.That(renderer.drawMode, Is.Not.EqualTo(SpriteDrawMode.Sliced), renderer.name);
                }
            }
            Assert.That(tilemap.layoutGrid.cellSize, Is.EqualTo(Vector3.one));
            foreach (var cell in tilemap.cellBounds.allPositionsWithin)
            {
                if (!tilemap.HasTile(cell)) continue;
                Assert.That(tilemap.GetSprite(cell).pixelsPerUnit, Is.EqualTo(32f), cell.ToString());
                Assert.That(tilemap.GetTransformMatrix(cell), Is.EqualTo(Matrix4x4.identity), cell.ToString());
            }
            Assert.That(GameObject.Find("Environment/Background/Sky"), Is.Not.Null);
            Assert.That(GameObject.Find("Environment/Background/Base"), Is.Not.Null);
            Assert.That(GameObject.Find("Environment/Background/Clouds"), Is.Not.Null);
            Assert.That(GameObject.Find("Environment/Background/Water"), Is.Not.Null);
            Assert.That(GameObject.Find("Environment/Decorations/Front Palm Left"), Is.Not.Null);
            Assert.That(GameObject.Find("Environment/Decorations/Front Palm Right"), Is.Not.Null);

            yield return null;

            Assert.That(spriteRenderer.sprite, Is.Not.Null);
            Assert.That(spriteRenderer.sprite.name, Is.Not.EqualTo("Runtime Player Placeholder"));
            Assert.That(animator.HasState(0, Animator.StringToHash("Base Layer.Idle")), Is.True);
            Assert.That(animator.HasState(0, Animator.StringToHash("Base Layer.Run")), Is.True);
            Assert.That(animator.HasState(0, Animator.StringToHash("Base Layer.Jump")), Is.True);
            Assert.That(animator.HasState(0, Animator.StringToHash("Base Layer.Fall")), Is.True);
            Assert.That(animator.HasState(0, Animator.StringToHash("Base Layer.Land")), Is.True);

            var expectedClipNames = new[]
            {
                "Captain_Idle",
                "Captain_Run",
                "Captain_Jump",
                "Captain_Fall",
                "Captain_Land"
            };
            var clips = animator.runtimeAnimatorController.animationClips;
            Assert.That(clips.Select(clip => clip.name), Is.EquivalentTo(expectedClipNames));
            Assert.That(clips.All(clip => Mathf.Approximately(clip.frameRate, 10f)), Is.True);

            var timeout = Time.time + 2f;
            while (!motor.ReadState().IsGrounded && Time.time < timeout)
            {
                yield return new WaitForFixedUpdate();
            }

            Assert.That(motor.ReadState().IsGrounded, Is.True);
            Assert.That(body.linearVelocity.y, Is.EqualTo(0f).Within(0.05f));
            Assert.That(player.transform.position.y, Is.EqualTo(-1.5625f).Within(0.05f));
            var bodyCollider = player.GetComponent<BoxCollider2D>();
            var groundCollider = GameObject.Find("Environment/Collision/Ground").GetComponent<BoxCollider2D>();
            Assert.That(bodyCollider.size, Is.EqualTo(new Vector2(0.625f, 0.875f)));
            Assert.That(bodyCollider.bounds.min.y, Is.EqualTo(groundCollider.bounds.max.y).Within(0.02f));

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
