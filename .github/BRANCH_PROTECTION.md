# 配置 GitHub 分支保护规则

为了确保所有 PR 在合并到 main 之前都通过 lint 和 test 检查，需要在 GitHub 仓库中配置分支保护规则。

## 配置步骤

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings** (设置)
3. 在左侧菜单中点击 **Branches** (分支)
4. 在 "Branch protection rules" 部分，点击 **Add rule** (添加规则)
5. 配置以下选项：

### 基本设置
- **Branch name pattern**: `main`

### 保护规则
勾选以下选项：

- ✅ **Require a pull request before merging** (合并前需要 PR)
  - 可选：勾选 "Require approvals" 并设置需要的审批人数（推荐至少 1 人）

- ✅ **Require status checks to pass before merging** (合并前需要状态检查通过)
  - 勾选 "Require branches to be up to date before merging" (合并前需要分支为最新)
  - 在搜索框中添加必需的检查：
    - `lint-and-test` (这是我们刚创建的 workflow job 名称)

- ✅ **Require conversation resolution before merging** (合并前需要解决所有对话) - 可选但推荐

- ✅ **Do not allow bypassing the above settings** (不允许绕过以上设置) - 可选，防止管理员直接推送

### 其他推荐选项
- ✅ **Require linear history** (要求线性历史) - 可选，保持提交历史清晰
- ✅ **Include administrators** (包括管理员) - 可选，让规则对所有人生效

6. 点击 **Create** 或 **Save changes** 保存规则

## 工作流说明

### PR Check Workflow (`pr-check.yml`)
- **触发时机**: 当有 PR 提交到 main 分支时
- **执行步骤**:
  1. 安装依赖
  2. 运行 lint 检查
  3. 运行单元测试
  4. 运行类型检查

只有所有检查都通过，GitHub 才会允许合并 PR。

### Deploy Workflow (`deploy.yml`)
- **触发时机**: 当代码合并到 main 分支时
- **执行步骤**: 构建并部署到 GitHub Pages

## 测试流程

1. 创建一个新分支并做一些修改
2. 提交 PR 到 main 分支
3. GitHub Actions 会自动运行 `pr-check.yml`
4. 查看 PR 页面的 "Checks" 标签，确认所有检查通过
5. 如果检查失败，需要修复问题后重新推送
6. 所有检查通过后，"Merge" 按钮才会变为可用状态

## 注意事项

- 首次配置后，需要至少运行一次 PR 检查，GitHub 才能识别到 `lint-and-test` 这个检查项
- 如果遇到 "Required status check is not present"，请先创建一个测试 PR 让 workflow 运行一次
- 管理员可以在必要时强制合并，但不推荐这样做
