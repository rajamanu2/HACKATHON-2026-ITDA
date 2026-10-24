import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,writeFileSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual,randomUUID,createHash} from 'node:crypto';

export const digest=value=>createHash('sha256').update(value).digest('hex');
export function passwordHash(password){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function passwordMatches(password,hash){const [salt,expected]=hash.split(':');return timingSafeEqual(Buffer.from(expected,'hex'),scryptSync(password,salt,64));}
export function openStore(directory){
 mkdirSync(directory,{recursive:true});const db=new DatabaseSync(join(directory,'drishti.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('worker','doctor','admin')),password_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,body TEXT NOT NULL,version INTEGER NOT NULL,created_by TEXT NOT NULL REFERENCES users(id),updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,patient_id TEXT NOT NULL REFERENCES patients(id),type TEXT NOT NULL,body TEXT NOT NULL,delivered_at TEXT,attempts INTEGER NOT NULL DEFAULT 0,last_error TEXT);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,record_id TEXT,at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS automation_receipts(event_id TEXT PRIMARY KEY,patient_id TEXT NOT NULL,type TEXT NOT NULL,received_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 if(!db.prepare('SELECT value FROM meta WHERE key=?').get('instanceId'))db.prepare('INSERT INTO meta VALUES(?,?)').run('instanceId',randomUUID());
 if(!db.prepare('SELECT id FROM users LIMIT 1').get()){
  const accounts=[['worker','Health worker'],['doctor','Medical officer'],['admin','District administrator']].map(([role,name])=>({id:randomUUID(),email:`${role}@drishti.local`,name,role,password:randomBytes(18).toString('base64url')}));
  const file=join(directory,'demo-accounts.json');if(existsSync(file))throw Error('Existing account file found with an empty database; refusing to overwrite.');
  const insert=db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)');db.exec('BEGIN');try{for(const u of accounts)insert.run(u.id,u.email,u.name,u.role,passwordHash(u.password));writeFileSync(file,JSON.stringify({notice:'Local synthetic demo accounts. Keep this file private.',accounts},null,2),{mode:0o600,flag:'wx'});db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }
 try{chmodSync(directory,0o700);chmodSync(join(directory,'drishti.sqlite'),0o600);}catch{}return db;
}
export function transaction(db,work){db.exec('BEGIN IMMEDIATE');try{const value=work();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}}
export function audit(db,user,action,id=null){db.prepare('INSERT INTO audit(actor,action,record_id,at) VALUES(?,?,?,?)').run(user.id,action,id,new Date().toISOString());}
export function patientFrom(row){return {...JSON.parse(row.body),version:row.version,createdBy:row.created_by,updatedAt:row.updated_at};}
export function putEvent(db,type,patient){const event={id:randomUUID(),type,patientId:patient.id,createdAt:new Date().toISOString(),data:{stage:patient.stage,village:patient.village}};db.prepare('INSERT INTO events(id,patient_id,type,body) VALUES(?,?,?,?)').run(event.id,event.patientId,type,JSON.stringify(event));}
