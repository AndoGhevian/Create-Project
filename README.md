# CreateProject
This is simple CLI Tool to create projects from Templates **scoped** to specific user or organsization.

## Usage
There is two ways to use **create-project**:
1. By Installing it globaly
2. Via npx

### Global Install
Steps for first case(global install)
1. First lets install it globaly, `npm i -g @ando_ghevian/create-project`
2. Set **scope** from which you want to download templates **(Templates start with cpj-template[-templatename])**, `create-project scope set @ando_ghevian`
3. Check that everything went smoothly, and **scope** is accepted `create-project scope get`
4. Create Project From: `create-project --template npm-package $projectPath`

You can also use another scope when creating project:
- `create-project scope use @elseScope --template temp prj`
- Or `create-project use @elseScope --template temp prj`

### NPX
Steps For npx:
- `npx @ando_ghevian/create-project use @Scope --template tmp prj`

Thats all:)