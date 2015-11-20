// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cprocess from 'child_process';
import * as fs from 'fs';
import * as file from './file';

//"egret.build","egret.buildEngine","egret.publish"

var commands = {
	init: {
		command: "egret.init"
	},
	build: {
		command: "egret.build",
		args: ['build']
	},
	buildEngine: {
		command: "egret.buildEngine",
		args: ['build', '-e']
	},
	publish: {
		command: "egret.publish",
		args: ['publish']
	},
	run: {
		command: "egret.startserver",
		args: ['startserver']
	}
};

var output: vscode.OutputChannel;
var egretServer:cprocess.ChildProcess;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	initCodeProject();
	Object.keys(commands).forEach(cmdKey=> {
		let cmd = commands[cmdKey].command;
		var disposable = vscode.commands.registerCommand(cmd, () => {
			runTask(cmdKey);
		});
		context.subscriptions.push(disposable);
	});
}


function runTask(cmdKey: string) {

	//
	if (cmdKey == 'init') {
		initCodeProject();
		return;
	}

	runEgretCommand(cmdKey);

}

function initCodeProject() {
	var tsconfig = {
		"compilerOptions": {
			"target": "ES5",
			"outDir": "bin-debug",
			"sourceMap": true
		},
		"exclude": [
			"bin-debug",
			"bin-release",
			"resource"
		]
	};

	var root = vscode.workspace.rootPath;
	var configPath = file.joinPath(root, "tsconfig.json");
	if (!file.exists(configPath)) {
		file.save(configPath, JSON.stringify(tsconfig, null, "   "));
		vscode.window.setStatusBarMessage('Added tsconfig.json for the project.');
	}

	var buildTask = {
		"version": "0.1.0",
		"command": "egret",
		"isShellCommand": true,
		"showOutput": "silent",
		"args": ["build"],
		"problemMatcher": "$tsc"
	}
	
	
	var tasks = file.joinPath(root,".vscode", "tasks.json");
	if (!file.exists(tasks)) {
		file.save(tasks, JSON.stringify(buildTask, null, "   "));
		vscode.window.setStatusBarMessage('Added build task for the project.');
	}
}

function runEgretCommand(cmdKey: string) {
	
	if(cmdKey=="run"){
		
		open('egret startserver "'+vscode.workspace.rootPath+'"');
		vscode.window.setStatusBarMessage('Egret Server is running...');
		return;
	}
	
	
	vscode.window.setStatusBarMessage('EgretCode is running...');
	var args: string[] = commands[cmdKey].args;
	var egretProcess = cprocess.exec("egret " + args.join(' '), {
		cwd: vscode.workspace.rootPath,
		encoding: "utf-8"
	}, (e: Error, stdout: Buffer, stderr: Buffer) => {
		if (e) {
			log(e.message);
		}
	});
	
	
	egretProcess.stdout.on('data', function(message) {
		log(message);
	});

	egretProcess.on('exit', function(message) {
		output && output.hide();
		vscode.window.setStatusBarMessage('Done!');
	});
}

function log(message: string) {
	if (output == undefined) {
		output = vscode.window.createOutputChannel("egret.output");
	}
	output.show();
	output.appendLine(message);
}

	
export function open(appName?, callback?, options?) {
    var opener;

    switch (process.platform) {
        case 'darwin':
			opener = 'open -a ' + file.escapePath(appName);
            break;
        case 'win32':
			opener = 'start ' + file.escapePath(appName);
			break;
    }

    return cprocess.exec(opener,options, callback);
}
