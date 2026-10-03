import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';

const projectId = 'demo-khaliya-rules';
let testEnv;
before(async () => {
  testEnv = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
after(async () => { await testEnv?.cleanup(); });

async function seedOffice({ officeId = 'office-test', code = 'KHALIYA-INV-00000001', members = [] } = {}) {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'office-manager'), {
      uid: 'office-manager', email: 'manager@example.com', name: 'مدير المكتب',
      role: 'manager', userCode: 'KHL-office-manager', officeId,
      officeName: 'مكتب خلية التجريبي', projectIds: [], onboardingComplete: true
    });
    await setDoc(doc(db, 'offices', officeId), {
      officeId, name: 'مكتب خلية التجريبي', ownerUid: 'office-manager',
      managerUids: ['office-manager'], memberUids: ['office-manager'], activeInviteCode: code
    });
    await setDoc(doc(db, 'publicInvites', code), {
      id: code, officeId, officeName: 'مكتب خلية التجريبي',
      managerUids: ['office-manager'], allowedRoles: ['pm', 'engineer', 'client', 'consultant'],
      scope: 'office', createdByUid: 'office-manager', status: 'active', createdAt: new Date()
    });
    for (const member of members) {
      await setDoc(doc(db, 'users', member.uid), {
        uid: member.uid, email: member.email, name: member.name, role: member.role || 'engineer',
        userCode: member.userCode || 'KHL-' + member.uid, officeId,
        officeName: 'مكتب خلية التجريبي', projectIds: ['project-1'], onboardingComplete: true
      });
      await setDoc(doc(db, 'offices', officeId, 'team', member.uid), {
        id: member.uid, uid: member.uid, userCode: member.userCode || 'KHL-' + member.uid,
        name: member.name, email: member.email, role: member.role || 'engineer',
        officeId, projectIds: ['project-1'], visibleTo: ['office-manager', member.uid]
      });
      await setDoc(doc(db, 'offices', officeId, 'joinRequests', member.uid), {
        id: member.uid, uid: member.uid, userCode: member.userCode || 'KHL-' + member.uid,
        name: member.name, email: member.email, role: member.role || 'engineer',
        specialty: '', officeId, officeName: 'مكتب خلية التجريبي', inviteCode: code,
        managerUids: ['office-manager'], status: 'accepted', createdAt: new Date()
      });
    }
  });
  return { officeId, code };
}
function joinPayload({ uid, email, role = 'engineer', officeId, code, userCode = 'KHL-' + uid, name = 'عضو جديد' }) {
  return {
    id: uid, uid, userCode, name, email, role, specialty: 'معماري', officeId,
    officeName: 'مكتب خلية التجريبي', inviteCode: code,
    managerUids: ['office-manager'], status: 'pending', createdAt: serverTimestamp()
  };
}
async function submitRequest({ uid, email, role = 'engineer', officeId, code, profileOfficeId = null }) {
  await testEnv.withSecurityRulesDisabled(async context => {
    const seedDb = context.firestore();
    await setDoc(doc(seedDb, 'users', uid), {
      uid, email, name: 'عضو ' + uid, role, userCode: 'KHL-' + uid,
      officeId: profileOfficeId, officeName: '', projectIds: [], onboardingComplete: false
    });
  });
  const db = testEnv.authenticatedContext(uid, { email }).firestore();
  const requestRef = doc(db, 'offices', officeId, 'joinRequests', uid);
  await assertSucceeds(getDoc(requestRef));
  const notificationId = 'NTF-' + uid;
  const batch = writeBatch(db);
  batch.set(requestRef, joinPayload({ uid, email, role, officeId, code }));
  batch.set(doc(db, 'offices', officeId, 'notifications', notificationId), {
    id: notificationId, officeId, type: 'join-request', title: 'طلب انضمام جديد',
    text: 'طلب انضمام من ' + uid, joinRequestUid: uid, createdByUid: uid,
    visibleTo: ['office-manager'], createdAt: serverTimestamp(), readBy: []
  });
  await assertSucceeds(batch.commit());
  return requestRef;
}
async function approveRequest({ uid, email, role = 'engineer', officeId, code }) {
  const managerDb = testEnv.authenticatedContext('office-manager', { email: 'manager@example.com' }).firestore();
  const batch = writeBatch(managerDb);
  batch.update(doc(managerDb, 'offices', officeId, 'joinRequests', uid), {
    status: 'accepted', reviewedByUid: 'office-manager', reviewedAt: serverTimestamp()
  });
  batch.update(doc(managerDb, 'users', uid), {
    officeId, officeName: 'مكتب خلية التجريبي', projectIds: [], onboardingComplete: true,
    inviteCode: code, joinRequestStatus: 'accepted', updatedAt: serverTimestamp()
  });
  batch.set(doc(managerDb, 'offices', officeId, 'team', uid), {
    id: uid, uid, userCode: 'KHL-' + uid, name: 'عضو ' + uid, email, role,
    specialty: '', officeId, projectIds: [], visibleTo: [uid, 'office-manager'],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  batch.set(doc(managerDb, 'offices', officeId, 'notifications', 'accepted-' + uid), {
    id: 'accepted-' + uid, officeId, type: 'join-request-approved', text: 'تم قبول طلب الانضمام',
    recipientUid: uid, visibleTo: [uid], createdByUid: 'office-manager',
    createdAt: serverTimestamp(), readBy: []
  });
  await assertSucceeds(batch.commit());
}
async function updateProfileMembership(db, uid, officeId) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), {
    officeId, officeName: 'مكتب خلية التجريبي', projectIds: [],
    onboardingComplete: true, inviteCode: 'KHALIYA-INV-00000001'
  });
  return batch.commit();
}

test('one office invite accepts multiple join requests while membership waits for manager approval', async () => {
  const { officeId, code } = await seedOffice();
  await submitRequest({ uid: 'engineer-one', email: 'one@example.com', role: 'pm', officeId, code, profileOfficeId: null });
  await submitRequest({ uid: 'engineer-two', email: 'two@example.com', officeId, code, profileOfficeId: '' });
  const managerDb = testEnv.authenticatedContext('office-manager', { email: 'manager@example.com' }).firestore();
  const queue = await assertSucceeds(getDocs(query(
    collection(managerDb, 'offices', officeId, 'joinRequests'), where('officeId', '==', officeId)
  )));
  assert.equal(queue.size, 2);

  const memberDb = testEnv.authenticatedContext('engineer-one', { email: 'one@example.com' }).firestore();
  assert.equal((await assertSucceeds(getDoc(doc(memberDb, 'offices', officeId, 'joinRequests', 'engineer-one')))).data().status, 'pending');
  await assertFails(getDoc(doc(memberDb, 'offices', officeId)));
  await assertFails(updateProfileMembership(memberDb, 'engineer-one', officeId));
  await approveRequest({ uid: 'engineer-one', email: 'one@example.com', role: 'pm', officeId, code });
  assert.equal((await assertSucceeds(getDoc(doc(memberDb, 'users', 'engineer-one')))).data().officeId, officeId);
  assert.equal((await assertSucceeds(getDoc(doc(managerDb, 'offices', officeId, 'joinRequests', 'engineer-two')))).data().status, 'pending');
  assert.equal((await assertSucceeds(getDoc(doc(managerDb, 'offices', officeId, 'notifications', 'NTF-engineer-one')))).data().type, 'join-request');
  assert.equal((await assertSucceeds(getDoc(doc(memberDb, 'publicInvites', code)))).data().status, 'active');
  const memberNote = await assertSucceeds(getDoc(doc(memberDb, 'offices', officeId, 'notifications', 'accepted-engineer-one')));
  assert.equal(memberNote.data().recipientUid, 'engineer-one');
});

test('non-members cannot forge a join request or link themselves to an office', async () => {
  const { officeId, code } = await seedOffice();
  await testEnv.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'users', 'outsider'), {
    uid: 'outsider', email: 'outsider@example.com', role: 'engineer', userCode: 'KHL-outsider',
    officeId: '', officeName: '', projectIds: [], onboardingComplete: false
  }));
  const db = testEnv.authenticatedContext('outsider', { email: 'outsider@example.com' }).firestore();
  await assertFails(getDoc(doc(db, 'offices', officeId, 'joinRequests', 'another-user')));
  const batch = writeBatch(db);
  batch.set(doc(db, 'offices', officeId, 'joinRequests', 'outsider'),
    joinPayload({ uid: 'outsider', email: 'outsider@example.com', officeId, code: 'KHALIYA-INV-99999999' }));
  batch.set(doc(db, 'offices', officeId, 'notifications', 'NTF-outsider'), {
    id: 'NTF-outsider', officeId, type: 'join-request', joinRequestUid: 'outsider',
    createdByUid: 'outsider', visibleTo: ['office-manager']
  });
  await assertFails(batch.commit());
  await assertFails(updateProfileMembership(db, 'outsider', officeId));
});

test('rotating the office invite revokes the old code for new requests', async () => {
  const { officeId, code: oldCode } = await seedOffice();
  const managerDb = testEnv.authenticatedContext('office-manager', { email: 'manager@example.com' }).firestore();
  const newCode = 'KHALIYA-INV-00000002';
  const batch = writeBatch(managerDb);
  batch.update(doc(managerDb, 'publicInvites', oldCode), {
    status: 'revoked', revokedAt: serverTimestamp(), revokedByUid: 'office-manager'
  });
  batch.set(doc(managerDb, 'publicInvites', newCode), {
    id: newCode, officeId, officeName: 'مكتب خلية التجريبي',
    managerUids: ['office-manager'], allowedRoles: ['pm', 'engineer', 'client', 'consultant'],
    scope: 'office', createdByUid: 'office-manager', status: 'active', createdAt: serverTimestamp()
  });
  batch.update(doc(managerDb, 'offices', officeId), { activeInviteCode: newCode });
  await assertSucceeds(batch.commit());
  const applicantDb = testEnv.authenticatedContext('new-applicant', { email: 'new@example.com' }).firestore();
  await assertFails(getDoc(doc(applicantDb, 'publicInvites', oldCode)));
  assert.equal((await assertSucceeds(getDoc(doc(applicantDb, 'publicInvites', newCode)))).data().status, 'active');
  await assertFails(submitRequest({ uid: 'new-applicant', email: 'new@example.com', officeId, code: oldCode }));
  await assertSucceeds(submitRequest({ uid: 'new-applicant', email: 'new@example.com', officeId, code: newCode }));
});

test('office manager can remove an employee and the former member loses workspace access', async () => {
  const { officeId, code } = await seedOffice({ members: [{ uid: 'employee', email: 'employee@example.com', name: 'موظف' }] });
  const managerDb = testEnv.authenticatedContext('office-manager', { email: 'manager@example.com' }).firestore();
  const batch = writeBatch(managerDb);
  batch.delete(doc(managerDb, 'offices', officeId, 'team', 'employee'));
  batch.update(doc(managerDb, 'offices', officeId, 'joinRequests', 'employee'), {
    status: 'removed', reviewedByUid: 'office-manager', reviewedAt: serverTimestamp()
  });
  batch.update(doc(managerDb, 'users', 'employee'), {
    officeId: '', officeName: '', projectIds: [], onboardingComplete: false,
    joinRequestStatus: 'removed', updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());
  const formerMember = testEnv.authenticatedContext('employee', { email: 'employee@example.com' }).firestore();
  await assertFails(getDoc(doc(formerMember, 'offices', officeId)));
  assert.equal((await assertSucceeds(getDoc(doc(formerMember, 'users', 'employee')))).data().officeId, '');
  await assertSucceeds(submitRequest({ uid: 'employee', email: 'employee@example.com', officeId, code }));
  assert.equal((await assertSucceeds(getDoc(doc(formerMember, 'offices', officeId, 'joinRequests', 'employee')))).data().status, 'pending');
});

test('an invitation role must match the registered account role', async () => {
  const { officeId, code } = await seedOffice();
  await testEnv.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'users', 'client-user'), {
    uid: 'client-user', email: 'client@example.com', role: 'client',
    userCode: 'KHL-client-user', officeId: '', officeName: '', projectIds: [], onboardingComplete: false
  }));
  const db = testEnv.authenticatedContext('client-user', { email: 'client@example.com' }).firestore();
  await assertFails(setDoc(doc(db, 'offices', officeId, 'joinRequests', 'client-user'),
    joinPayload({ uid: 'client-user', email: 'client@example.com', role: 'consultant', officeId, code })));
});


test('project manager store queries can read office team and only assigned project data', async () => {
  const { officeId } = await seedOffice();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'pm-reader'), {
      uid: 'pm-reader', email: 'pm@example.com', role: 'pm', userCode: 'KHL-pm-reader',
      officeId, officeName: 'مكتب خلية التجريبي', projectIds: ['project-1'], onboardingComplete: true
    });
    await setDoc(doc(db, 'offices', officeId, 'team', 'engineer-member'), {
      id: 'engineer-member', uid: 'engineer-member', role: 'engineer', officeId,
      visibleTo: ['office-manager', 'pm-reader']
    });
    await setDoc(doc(db, 'offices', officeId, 'consultants', 'consultant-one'), {
      id: 'consultant-one', uid: 'consultant-one', officeId, visibleTo: ['office-manager', 'pm-reader']
    });
    await setDoc(doc(db, 'offices', officeId, 'projects', 'project-1'), {
      id: 'project-1', projectId: 'project-1', officeId, visibleTo: ['pm-reader']
    });
    await setDoc(doc(db, 'offices', officeId, 'tasks', 'task-1'), {
      id: 'task-1', projectId: 'project-1', officeId, visibleTo: ['pm-reader']
    });
  });
  const db = testEnv.authenticatedContext('pm-reader', { email: 'pm@example.com' }).firestore();
  await assertSucceeds(getDoc(doc(db, 'offices', officeId)));
  const team = await assertSucceeds(getDocs(query(
    collection(db, 'offices', officeId, 'team'), where('officeId', '==', officeId)
  )));
  const consultants = await assertSucceeds(getDocs(query(
    collection(db, 'offices', officeId, 'consultants'), where('officeId', '==', officeId)
  )));
  const projects = await assertSucceeds(getDocs(query(
    collection(db, 'offices', officeId, 'projects'), where('visibleTo', 'array-contains', 'pm-reader')
  )));
  const tasks = await assertSucceeds(getDocs(query(
    collection(db, 'offices', officeId, 'tasks'), where('visibleTo', 'array-contains', 'pm-reader')
  )));
  assert.equal(team.size, 1);
  assert.equal(consultants.size, 1);
  assert.equal(projects.size, 1);
  assert.equal(tasks.size, 1);
});
