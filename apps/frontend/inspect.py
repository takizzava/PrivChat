from pathlib import Path
text = Path('app/chats/[id]/page.tsx').read_text()
print(text.count('key={'))
