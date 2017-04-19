import { model } from './modelDefinitions';
import { skin } from './skin';
import { http } from './http';

export let quickstart = {
	steps: {},
	state: {} as any,
	types: {
		ENSEIGNANT: 'teacher',
		ELEVE: 'student',
		PERSEDUCNAT: 'personnel',
		PERSRELELEVE: 'relative'
	},
	mySteps: [],
	assistantIndex: {},
	assistantStep: function(index){
		return skin.basePath + 'template/assistant/' + this.types[model.me.type] + '/' + index + '.html';
	},
	nextAssistantStep: function(){
		this.state.assistant ++;
		if(this.state.assistant === this.steps[this.types[model.me.type]]){
			this.state.assistant = -1;
			this.assistantIndex = undefined;
		}
		else{
			this.assistantIndex = this.mySteps[this.state.assistant];
		}

		this.save();
	},
	nextAppStep: function(){
		this.state[skin.skin][this.app]++;
		this.save();
		return this.state[skin.skin][this.app];
	},
	previousAppStep: function(){
		this.state[skin.skin][this.app]--;
		this.save();
		return this.state[skin.skin][this.app];

	},
	goToAppStep: function(index){
		this.state[skin.skin][this.app] = index;
		this.save();
		return index;
	},
	closeApp: function(){
		this.state[skin.skin][this.app] = -1;
		this.save();
	},
	appIndex: function(){
		this.app = window.location.href.split('//')[1].split('/').slice(1).join('/');
		if(!this.state[skin.skin]){
			this.state[skin.skin] = {};
		}
		if(!this.state[skin.skin][this.app]){
			this.state[skin.skin][this.app] = 0;
		}
		return this.state[skin.skin][this.app];
	},
	previousAssistantStep: function(){
		this.state.assistant --;
		if(this.state.assistant < 0){
			this.state.assistant = 0;
		}
		this.assistantIndex = this.mySteps[this.state.assistant];
		this.save();
	},
	save: function(cb?: () => void){
		http().putJson('/userbook/preference/quickstart', this.state).done(function(){
			if(typeof cb === 'function'){
				cb();
			}
		});
	},
	goTo: function(index){
		if(index > this.mySteps.length){
			index = -1;
		}
		this.state.assistant = index;
		if(index !== -1){
			this.assistantIndex = this.mySteps[index];
		}

		this.save();
	},
	loaded: false,
	awaiters: [],
	load: function(cb){
		if(this.loaded){
			if(typeof cb === 'function'){
				cb();
			}
			return;
		}

		this.awaiters.push(cb);
		if(this.loading){
			return;
		}
		this.loading = true;
		http().get('/userbook/preference/quickstart').done(function(pref){
			let preferences;
			if(pref.preference){
				try{
					preferences = JSON.parse(pref.preference);
				}
				catch(e){
					console.log('Error parsing quickstart preferences');
				}
			}
			if(!preferences){
				preferences = {};
			}

			if(!preferences.assistant){
				preferences.assistant = 0;
			}
			if(!preferences[skin.skin]){
				preferences[skin.skin] = {};
			}

			this.state = preferences;

			if(preferences.assistant !== -1){
				http().get(skin.basePath + 'template/assistant/steps.json').done(function(steps){
					this.steps = steps;
					let nbSteps = this.steps[this.types[model.me.type]];
					for(let i = 0; i < nbSteps; i++){
						this.mySteps.push({
							index: i,
							path: this.assistantStep(i)
						});
						this.assistantIndex = this.mySteps[this.state.assistant];
					}
					this.loaded = true;
					this.awaiters.forEach(function(cb){
						if(typeof cb === 'function'){
							cb();
						}
					});
				}.bind(this));
			}
			else{
				this.loaded = true;
				this.awaiters.forEach(function(cb){
					if(typeof cb === 'function'){
						cb();
					}
				});
			}
		}.bind(this));
	}
};