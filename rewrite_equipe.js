const fs = require('fs');

let content = fs.readFileSync('src/pages/Equipe.tsx', 'utf8');

// Replace SVGs to add aria-hidden
content = content.replace(/<(Users|UserPlus|Search|Mail|Phone|Shield|BadgeCheck|MoreVertical|RefreshCw|X|ChevronRight|Star|TrendingUp|Zap|Filter|Calendar|Settings2|ShieldAlert)( [^>]+)?\/>/g, '<$1 aria-hidden="true"$2/>');
// Note: handle the ones that already have attributes
// Wait, a better way is to do it manually in the file or write a targeted regex
