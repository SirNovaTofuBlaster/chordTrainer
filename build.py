"""Builds index.html from the files in src/. Run: python3 build.py"""
import pathlib
root = pathlib.Path(__file__).parent
s = root / "src"
css = "html { color-scheme: light; }\n" + (s / "styles.css").read_text() + "\nbody { margin: 0; }\n"
js = "\n".join((s / f).read_text().replace("if (typeof module", "if (false && typeof module") for f in ["theory.js", "app1.js", "app2.js", "app3.js", "app4.js"])
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chord Trainer</title>
<meta name="description" content="Guitar chords, scales and practice tools with a left-handed and right-handed switch.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>
{css}</style>
</head>
<body>
{(s / "body.html").read_text()}<script>
{js}
</script>
</body>
</html>
'''
(root / "index.html").write_text(page)
print("wrote index.html,", len(page), "bytes")
