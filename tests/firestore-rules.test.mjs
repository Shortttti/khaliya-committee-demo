import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';

const projectId = 'demo-khaliya-rules';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') }
  });
});

after(async () => {
  await testEnv?.cleanup();
});

async function seedInvite({ uid, role, tokenEmail, inviteEmail, code, officeId }) {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: tokenEmail,
      role,
      userCode: 'KHL-' + uid,
      officeId: '',
      officeName: '',
      projectIds: [],
      onboardingComplete: false
    });
    await setDoc(doc(db, 'publicInvites', code), {
      officeId,
      officeName: 'مكتب اختبار القواعد',
      email: inviteEmail,
      role,
      projectIds: [],
      createdByUid: 'office-owner',
      status: 'pending',
      createdAt: new Date()
    });
  });
}

async function acceptInvite({ uid, role, tokenEmail, code, officeId }) {
  const db = testEnv.authenticatedContext(uid, { email: tokenEmail }).firestore();
  const inviteRef = doc(db, 'publicInvites', code);
  const userRef = doc(db, 'users', uid);

  await assertSucceeds(getDoc(inviteRef));
  const batch = writeBatch(db);
  batch.update(inviteRef, {
    acceptedBy: uid,
    status: 'accepted',
    acceptedAt: serverTimestamp()
  });
  batch.update(userRef, {
    officeId,
    officeName: 'مكتب اختبار القواعد',
    projectIds: [],
    onboardingComplete: true,
    inviteCode: code,
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(batch.commit());

  await assertSucceeds(setDoc(doc(db, 'offices', officeId, 'team', uid), {
    id: uid,
    uid,
    userCode: 'KHL-' + uid,
    name: 'عضو اختبار',
    email: tokenEmail,
    role,
    specialty: '',
    officeId,
    projectIds: [],
    visibleTo: [uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  if (role === 'consultant') {
    await assertSucceeds(setDoc(doc(db, 'offices', officeId, 'consultants', uid), {
      id: uid,
      uid,
      name: 'استشاري اختبار',
      specialty: '',
      available: true,
      officeId,
      visibleTo: [uid],
      updatedAt: serverTimestamp()
    }));
  }
}

test('project manager accepts a matching invite when email letter case differs', async () => {
  const args = {
    uid: 'pm-test-user',
    role: 'pm',
    tokenEmail: 'Project.Manager@example.com',
    inviteEmail: 'project.manager@example.com',
    code: 'KHALIYA-INV-00000001',
    officeId: 'office-pm-test'
  };
  await seedInvite(args);
  await acceptInvite(args);
});

test('consultant accepts a matching invite when email letter case differs', async () => {
  const args = {
    uid: 'consultant-test-user',
    role: 'consultant',
    tokenEmail: 'Consultant@example.com',
    inviteEmail: 'consultant@example.com',
    code: 'KHALIYA-INV-00000002',
    officeId: 'office-consultant-test'
  };
  await seedInvite(args);
  await acceptInvite(args);
});

test('an invite for a different role cannot complete onboarding', async () => {
  const args = {
    uid: 'wrong-role-user',
    role: 'consultant',
    tokenEmail: 'wrong.role@example.com',
    inviteEmail: 'wrong.role@example.com',
    code: 'KHALIYA-INV-00000003',
    officeId: 'office-role-mismatch'
  };
  await seedInvite({ ...args, role: 'pm' });
  const db = testEnv.authenticatedContext(args.uid, { email: args.tokenEmail }).firestore();
  const batch = writeBatch(db);
  batch.update(doc(db, 'publicInvites', args.code), {
    acceptedBy: args.uid,
    status: 'accepted',
    acceptedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', args.uid), {
    officeId: args.officeId,
    officeName: 'مكتب اختبار القواعد',
    projectIds: [],
    onboardingComplete: true,
    inviteCode: args.code,
    updatedAt: serverTimestamp()
  });
  await assertFails(batch.commit());
});
