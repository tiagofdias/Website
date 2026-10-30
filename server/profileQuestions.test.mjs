import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileQuestionKey,resolveProfileQuestion,profileReference} from './profileQuestions.mjs';
test('age variants answer honestly without a provider or guessed date',()=>{
 for(const question of ['how old is he','How old is Tiago?','What is his age?','When was he born?']) {
  assert.equal(profileQuestionKey(question),'age');
  assert.match(resolveProfileQuestion(question).response,/not documented/);
 }
});
test('common typed questions use saved facts; detailed prompts remain live',()=>{
 assert.equal(profileQuestionKey('Tell me about his experience.'),'experience');
 assert.equal(profileQuestionKey('what are his skills?'),'skills');
 assert.equal(profileQuestionKey('Explain his Python architecture tradeoffs for a remote banking role'),null);
 assert.equal(profileQuestionKey('How old is his Python project?'),null);
 assert.equal(profileQuestionKey('We need an engineer. Tell me about his experience.'),null);
 assert.equal(resolveProfileQuestion('his projects',{projects:{response:'verified projects'}}).response,'verified projects');
});
test('outage references require relevant evidence and are explicitly labeled',()=>{
 const answers={ai:{response:'Built Python RAG retrieval tools.',target:'experience'},intro:{response:'Generic biography.'}};
 const matched=profileReference('Explain Python retrieval architecture',answers);
 assert.equal(matched.source,'reference');assert.match(matched.response,/Python RAG/);assert.match(matched.response,/may not fully answer/);
 const unknown=profileReference('What is his favorite pizza?',answers);
 assert.doesNotMatch(unknown.response,/Generic biography|Python RAG/);assert.match(unknown.response,/couldn’t find a verified answer/);
});
