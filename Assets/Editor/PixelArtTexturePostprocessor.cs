using System;
using UnityEditor;
using UnityEngine;

namespace CleanArchitecture.Editor
{
    // Content 아래의 픽셀 아트만 관리하며 패키지·Unity 기본 리소스는 제외한다.
    internal sealed class PixelArtTexturePostprocessor : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith("Assets/Content/", StringComparison.Ordinal))
            {
                return;
            }

            var importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spritePixelsPerUnit = 32f;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.mipmapEnabled = false;
            importer.npotScale = TextureImporterNPOTScale.None;
        }
    }
}
