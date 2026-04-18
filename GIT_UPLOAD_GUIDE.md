# Git 上传步骤指南

## 当前Git配置

✅ 用户名: yumi  
✅ 邮箱: 384388650@qq.com  

---

## 上传到GitHub步骤

### 步骤1: 在GitHub创建仓库

1. 访问 https://github.com/new
2. 填写信息:
   - Repository name: `openclaw-monitor`
   - Description: `Openclaw Activity Monitor - 实时监控openclaw活动`
   - 选择 Public 或 Private
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要勾选 "Add .gitignore"
   - ❌ 不要选择 License
3. 点击 "Create repository"

### 步骤2: 配置远程仓库地址

创建仓库后,GitHub会显示仓库地址,类似:
```
https://github.com/yumi/openclaw-monitor.git
```

在命令行执行:
```bash
cd d:/Code/smtp

# 删除旧的远程配置
git remote remove origin

# 添加你的GitHub仓库地址
git remote add origin https://github.com/yumi/openclaw-monitor.git

# 验证配置
git remote -v
```

### 步骤3: 推送代码到GitHub

```bash
cd d:/Code/smtp

# 推送主分支
git push -u origin master

# 推送所有标签
git push origin --tags
```

### 步骤4: 验证上传成功

访问你的GitHub仓库页面:
```
https://github.com/yumi/openclaw-monitor
```

应该能看到:
- ✅ 所有代码文件
- ✅ README.md 显示在首页
- ✅ v1.0.0 标签

---

## 如果需要认证

### 方式1: 使用Personal Access Token (推荐)

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选权限:
   - ✅ repo (完整仓库访问)
4. 生成并复制token

推送时使用token:
```bash
git push https://YOUR_TOKEN@github.com/yumi/openclaw-monitor.git
```

### 方式2: 使用SSH密钥

1. 生成SSH密钥:
```bash
ssh-keygen -t ed25519 -C "384388650@qq.com"
```

2. 查看公钥:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. 添加到GitHub:
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容

4. 使用SSH地址:
```bash
git remote set-url origin git@github.com:yumi/openclaw-monitor.git
git push -u origin master
```

---

## 完整命令(复制粘贴)

```bash
# 进入项目目录
cd d:/Code/smtp

# 配置远程仓库(替换为你的实际地址)
git remote remove origin
git remote add origin https://github.com/yumi/openclaw-monitor.git

# 推送代码
git push -u origin master

# 推送标签
git push origin --tags

# 查看状态
git status
```

---

## 常见问题

### Q: 推送时提示 "fatal: 'origin' already exists"
```bash
git remote remove origin
git remote add origin https://github.com/yumi/openclaw-monitor.git
```

### Q: 推送时提示认证失败
使用Personal Access Token或配置SSH密钥

### Q: 推送时提示 "failed to push some refs"
```bash
# 强制推送(谨慎使用)
git push -f origin master
```

---

## 后续维护

### 日常提交
```bash
git add .
git commit -m "feat: 新功能"
git push origin master
```

### 发布新版本
```bash
# 更新代码
git commit -m "feat: 新功能"

# 创建标签
git tag -a v1.1.0 -m "Release v1.1.0"

# 推送
git push origin master --tags
```

---

## 项目信息

- **仓库名**: openclaw-monitor
- **当前版本**: v1.0.0
- **主分支**: master
- **提交数**: 1
- **文件数**: 18

---

完成以上步骤后,项目就成功上传到GitHub了! 🎉
