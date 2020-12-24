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
4. Create Project From: `create-project --template npm-package my-package`

You can also use another scope when creating project:
- `create-project scope use @elseScope --template temp prj`
- `create-project use @elseScope --template temp prj` (**use** is alias for **scope use**)

You can create project when setting **scope**:
- `create-project scope set @ando_ghevan -t npm-package my-package`

You can also use templates from url, and in this case you dont need any **scope** to be set.
- `create-project -t git@github.com:AndoGhevian/cpj-template-npm-package.git proj`

You can just test your local **Templates(See below "How to create Templates")**:
- `create-project -t file:../../MyTemplate prj`
- `create-project -t file:/path/from/root/to/template prj`

### NPX
Steps For npx:
- `npx @ando_ghevian/create-project use @Scope --template tmp prj`

## How to create Templates
It's similar to [create-react-app Custom Templates][cra-custom-templates]. Just few differences:
1. Templates from **npm registry** must be scoped to **organization** or **user** and fit the format **cpj-template[-templatename]**, where **cpj-template** will be used as default if **--template(-t)** is specified without value **(Or not specified)**.
1. You can Use Templates also from **Code Hosting Platforms** like [github][github] and [gitlab][gitlab]. In this case **scope** is not needed. And Template Name can be anything, i.e. no need to start with **cpj-template**. Template just **HAS TO** stick to the rules, that we have defined.
1. Default Key/Value Pairs of created projects **package.json** file, come from `npm init -y` command, and anything you specify in **template.json** in **/package** property, will replace default ones.
1. You **MUST NOT** specify **package.json**, **package-lock.json** and **node_modules/** in template folder **(/template)**. They will be simply ignored.
1. And Currently We will replace all **{{ProjectName}}** occurrences in README.md with your project name.

[github]: https://github.com/
[gitlab]: https://gitlab.com/
[cra-custom-templates]: https://create-react-app.dev/docs/custom-templates/#building-a-template