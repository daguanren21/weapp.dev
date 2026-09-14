# Skill 索引与规范来源

本仓库使用的 Codex skill 分为项目级 `.agents/skills` 与用户级 `.codex/skills`。同名 skill 只保留一个规范来源，项目内文档引用规范版本。

## 重复与迁移

| 能力                       | 规范来源                                           | 处理                                                   |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `design-taste-frontend`    | `.codex/skills/taste-skill/SKILL.md`               | 主版本，面向首页、landing page 与 redesign             |
| `design-taste-frontend-v1` | `.agents/skills/design-taste-frontend-v1/SKILL.md` | 保留为旧项目兼容版本，不作为默认                       |
| `impeccable`               | `.codex/skills/impeccable/SKILL.md`                | 只保留一份可发现安装                                   |
| 中文 humanizer 系列        | 各自原路径                                         | 暂不合并，按学术写作、中文自然化和中文写作痕迹清理区分 |

## weapp.dev 默认组合

- 首页与营销页面：`design-taste-frontend`
- Astro / 小程序工程实践：`weapp-vite-best-practices`、`wevu-best-practices`、`weapp-tailwindcss`
- DevTools 与端到端验收：`weapp-devtools-e2e-best-practices`
- 文档与网站同步：`docs-and-website-sync`

新增 skill 前，先检查两个根目录是否已有同名或职责重叠能力，并在本索引中记录规范来源。
