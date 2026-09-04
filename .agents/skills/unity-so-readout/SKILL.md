---
name: unity-so-readout
description: Unity ScriptableObject(.asset) 파일의 필드·값을 근거로 삼을 때 YAML 직독 대신 에디터에서 실제 로드된 객체를 SerializedObject로 덤프해 읽는 절차. 필드명·enum·참조·실효값을 정확히 얻는다. .asset의 스탯·수치·구조를 조사하거나 설명할 때 사용.
---

# Unity SO 정확 읽기 (.asset 전용)

`.asset`(ScriptableObject)의 **필드나 값을 근거로 삼을 때는 Read로 YAML을 읽지 않는다.** 아래 덤프를 써서 에디터가 실제로 로드한 객체를 읽는다.

## 왜

`.asset` YAML은 **그 파일이 마지막으로 저장된 시점의 스냅샷**이다. Unity는 저장할 때 건드린 에셋만 다시 쓰므로, C#에서 필드가 바뀌어도 안 만진 에셋은 옛 스키마 그대로 남는다. 같은 폴더 안에서도 파일마다 다르다.

실측 (CatGirlSurvivor, `Assets/Main/Database/World/Bullet/`):
- `enemyData:` (현재 필드명) — 35개 파일
- `enemy:` (옛 필드명) — 70개 파일
- `isInstantKill` (나중에 추가된 필드) — 7개 파일에만 존재

**최근 안 건드린 파일일수록 낡았다.** 구조 파악하려고 오래된 에셋을 열면 없는 필드를 있다고 믿게 되고, 하네싱으로 막을 수 없다 — AI가 추측한 게 아니라 파일에 실제로 그렇게 적혀 있기 때문이다.

YAML 직독이 틀리는 6가지:

| 유형 | YAML | 실제 |
|---|---|---|
| 필드명이 낡음 | `enemy:` | `enemyData` |
| 없는 필드 누락 | `laser` 블록 없음 | `laser.laserSpeed` 등 존재 |
| 죽은 키 잔존 | `durationBetweenRepeats: 0` | 클래스에 그 필드 없음 |
| enum이 정수 | `knockbackStyle: 1` | `AddForce` |
| 참조가 GUID | `{guid: 5d562efe...}` | `Bolt @ Assets/.../Bolt.prefab` |
| **실효값이 다름** | `invincibilityDuration: 0` | `0.1` (OnValidate가 clamp) |

## 전제

Unity Editor가 실행 중이어야 한다. 확인:

```bash
uloop execute-dynamic-code --code "return UnityEditor.EditorApplication.applicationPath;"
```

**꺼져 있으면**: `uloop launch`로 켜거나, 부득이 YAML을 Read로 읽되 **결론에 "에셋 저장 시점 스냅샷이라 필드명이 현재 코드와 다를 수 있음 (미검증)"을 반드시 명시**한다. 조용히 YAML로 대체하지 않는다.

## 사용법

아래 스니펫에서 **상단 파라미터 4줄만 고쳐** 실행한다.

- `assetPath` — 조사할 `.asset` 경로 (Assets/ 로 시작)
- `startPath` — `""`면 전체. 큰 에셋은 `"gameplay"`, `"gameplay.damage"`처럼 부분 지정
- `arrayCap` — 배열 원소 표시 상한 (기본 20)
- `lineCap` — 전체 줄 수 상한 (기본 400)

```bash
CODE=$(cat <<'EOF'
using System;
using System.Text;
using UnityEditor;
using UnityEngine;

// ===== 파라미터 =====
var assetPath = "Assets/Main/Database/World/Bullet/Skill/SO_Bullet_Bolt.asset";
var startPath = "";
var arrayCap  = 20;
var lineCap   = 400;
// ====================

var obj = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(assetPath);
if (obj == null) return "NOT FOUND: " + assetPath;

var so = new SerializedObject(obj);
var sb = new StringBuilder();
sb.AppendLine("ASSET: " + assetPath);
sb.AppendLine("CLASS: " + obj.GetType().FullName);

SerializedProperty it;
SerializedProperty end = null;
int baseDepth = 0;
if (string.IsNullOrEmpty(startPath)) {
    it = so.GetIterator();
} else {
    var root = so.FindProperty(startPath);
    if (root == null) return "PROPERTY NOT FOUND: " + startPath + " (class: " + obj.GetType().FullName + ")";
    sb.AppendLine("START: " + startPath);
    it = root.Copy();
    end = root.GetEndProperty();
    baseDepth = root.depth + 1;
}

int lines = 0;
bool truncated = false;
while (it.NextVisible(true)) {
    if (end != null && SerializedProperty.EqualContents(it, end)) break;
    if (lines >= lineCap) { truncated = true; break; }
    if (it.propertyType == SerializedPropertyType.ArraySize) continue;

    var path = it.propertyPath;
    bool skip = false;
    int scan = 0;
    while (true) {
        int p = path.IndexOf("Array.data[", scan, StringComparison.Ordinal);
        if (p < 0) break;
        int s = p + 11;
        int e = path.IndexOf(']', s);
        if (e < 0) break;
        int idx;
        if (int.TryParse(path.Substring(s, e - s), out idx) && idx >= arrayCap) { skip = true; break; }
        scan = e + 1;
    }
    if (skip) continue;

    string val;
    switch (it.propertyType) {
        case SerializedPropertyType.ObjectReference:
            var o = it.objectReferenceValue;
            val = o == null ? "null" : (o.name + " <" + o.GetType().Name + "> @ " + AssetDatabase.GetAssetPath(o));
            break;
        case SerializedPropertyType.Enum:
            var names = it.enumNames;
            var lbl = (names != null && it.enumValueIndex >= 0 && it.enumValueIndex < names.Length) ? names[it.enumValueIndex] : "?";
            val = lbl + " (" + it.intValue + ")";
            break;
        case SerializedPropertyType.Boolean: val = it.boolValue.ToString(); break;
        case SerializedPropertyType.Integer: val = it.intValue.ToString(); break;
        case SerializedPropertyType.Float:   val = it.type == "double" ? it.doubleValue.ToString() : it.floatValue.ToString(); break;
        case SerializedPropertyType.String:  val = "\"" + it.stringValue + "\""; break;
        case SerializedPropertyType.Vector2: val = it.vector2Value.ToString(); break;
        case SerializedPropertyType.Vector3: val = it.vector3Value.ToString(); break;
        case SerializedPropertyType.Color:   val = it.colorValue.ToString(); break;
        case SerializedPropertyType.Generic: val = "{" + it.type + "}"; break;
        default: val = it.propertyType.ToString(); break;
    }

    if (it.isArray && it.propertyType != SerializedPropertyType.String) {
        val = "Array[" + it.arraySize + "]";
        if (it.arraySize > arrayCap)
            val += "  <== first " + arrayCap + " shown, " + (it.arraySize - arrayCap) + " OMITTED";
    }

    var label = it.name;
    if (label == "data" && path.EndsWith("]", StringComparison.Ordinal)) {
        int lb = path.LastIndexOf("Array.data[", StringComparison.Ordinal);
        if (lb >= 0) label = "[" + path.Substring(lb + 11, path.Length - 1 - (lb + 11)) + "]";
    }

    sb.Append(new string(' ', Math.Max(0, it.depth - baseDepth) * 2));
    sb.Append(label).Append(" : ").Append(it.type).Append(" = ").AppendLine(val);
    lines++;
}
if (truncated)
    sb.AppendLine("... LINE CAP " + lineCap + " REACHED - REST OMITTED (narrow with startPath)");
return sb.ToString();
EOF
)
uloop execute-dynamic-code --code "$CODE"
```

반환은 JSON이고 본문이 `\r\n`으로 이스케이프돼 읽기 나쁘다. 풀어서 보려면 뒤에 붙인다:

```bash
| python -c "import sys,json;d=json.load(sys.stdin);print(d['Result'] if d['Success'] else d)"
```

## 출력 읽는 법

```
ASSET: Assets/Main/Database/World/Bullet/Skill/SO_Bullet_Bolt.asset
CLASS: CGS.Model.BulletSO                          ← 실제 C# 클래스 (GUID 해석 완료)
timeToLive : float = 3
bulletPrefab : PPtr<$Bullet> = Bolt <Bullet> @ Assets/.../Bolt.prefab   ← 참조 해석 완료
gameplay : BulletPlayData = {BulletPlayData}
  invincibilityDuration : float = 0.1              ← OnValidate 반영된 실효값
  knockbackStyle : Enum = AddForce (1)             ← enum 라벨 (원값 괄호)
actions : BulletActionData = Array[99]  <== first 20 shown, 79 OMITTED
  [0] : BulletActionData = {BulletActionData}      ← 배열 인덱스
```

- 형식: `필드명 : 타입 = 값`, 중첩은 2칸 들여쓰기
- `{TypeName}` = 중첩 클래스 컨테이너 (값 없음, 자식이 실제 데이터)
- `PPtr<$T>` = T 타입 참조. `null`이어도 타입은 표시됨
- **`OMITTED` / `LINE CAP` 표기가 있으면 전부 본 게 아니다.** 그 상태로 "없다"고 결론내지 말고 `startPath`나 `arrayCap`을 조정해 재조회한다

## 주의

- **이건 디스크가 아니라 에디터 메모리를 본다.** 저장 안 된 인스펙터 변경이 섞일 수 있고, OnValidate가 반영돼 있다. "git에 커밋될 값"이 궁금하면 그때는 YAML이 맞다 — 목적을 구분할 것
- `NextVisible`은 인스펙터에 보이는 필드 기준이라 `[HideInInspector]`는 빠진다
- **필드가 존재한다 ≠ 사용된다.** 값을 근거로 동작을 설명하려면 그 필드를 읽는 코드(read site)를 별도로 검색해야 한다 (`evidence-analysis` 5번)

## 범위 밖

- **프리팹·씬** — `.prefab`/`.unity`는 대상이 아니다. Git 저장 상태의 전후 변화는 `unity-vcs-evidence`, 현재 Editor 메모리의 컴포넌트 프로퍼티·계층은 `uloop find-game-objects`·`uloop get-hierarchy`를 사용한다.
- **수정** — 이 스킬은 읽기 전용이다. SO 값 변경은 프로젝트 스킬 `uloop-execute-dynamic-code`의 `references/scriptableobject.md` 참조
