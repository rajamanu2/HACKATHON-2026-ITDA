import test from 'node:test';
import assert from 'node:assert/strict';
import {qualityMetrics,overdue,makeEvent,pendingEvents} from '../public/domain.js';
test('blank and dark photographs fail basic quality checks',()=>{const pixels=new Uint8ClampedArray(160*160*4).fill(0);assert.equal(qualityMetrics(pixels,160,160).pass,false);pixels.fill(255);assert.equal(qualityMetrics(pixels,160,160).pass,false);});
test('completed care is never reported overdue',()=>{assert.equal(overdue({due:'2020-01-01',stage:'closed'},'2026-10-24'),false);assert.equal(overdue({due:'2020-01-01',stage:'referred'},'2026-10-24'),true);assert.equal(overdue({due:'2026-10-24',stage:'referred'},'2026-10-24'),false);});
test('automation excludes patient identifiers and images',()=>{const e=makeEvent('screening.created',{id:'AD-1',name:'Private',phone:'1234',photo:'secret',history:'private',stage:'screened',village:'Demo'});assert.deepEqual(Object.keys(e.data).sort(),['stage','village']);assert.equal(JSON.stringify(e).includes('Private'),false);assert.equal(pendingEvents([e,{...e,delivered:true}]).length,1);});
