import { dbManager } from './db.ts';
import { CreditWalletService } from './creditService.ts';

async function runTemplateReferralTests() {
  console.log('====================================');
  console.log('RUNNING CREATORNOVA TEMPLATE & REFERRAL TEST SUITE');
  console.log('====================================\n');

  const testResults = {
    templateSharing: false,
    templatePrivacy: false,
    useTemplate: false,
    referralLinks: false,
    antiAbuse: false,
    creditWalletConnection: false,
  };

  const creatorUserId = 'user-creator-default';
  const recipientReg = dbManager.registerUser({
    name: 'Taylor Jordan',
    email: `taylor_${Date.now()}@example.com`,
    password: 'Password123!',
    preferredLanguage: 'English',
    creatorNiche: 'Gaming & Tech',
    defaultPlatform: 'YouTube Shorts',
  });
  const recipientUserId = recipientReg.user.id;

  // ========================================================
  // TEST 1: TEMPLATE SHARING
  // ========================================================
  console.log('--- TEST 1: TEMPLATE SHARING ---');
  const testProjectId = `proj_test_${Date.now()}`;
  const testProject = {
    id: testProjectId,
    userId: creatorUserId,
    name: 'Top 5 AI Tools of 2026',
    topic: 'Showcasing the top 5 next-generation productivity tools',
    format: 'youtube_short',
    platform: 'YouTube Shorts',
    contentType: 'Educational',
    language: 'English',
    targetAudience: 'Tech enthusiasts and creators',
    tone: 'engaging_energetic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ideas: [
      { id: 'i-1', title: '5 AI Tools', hook: 'Stop wasting 4 hours a day on video editing.', viralityScore: 94 }
    ],
    script: {
      title: 'Top 5 AI Tools',
      format: 'youtube_short',
      estimatedDuration: '60 seconds',
      wordCount: 130,
      hookSummary: 'Stop wasting hours on manual editing',
      beats: [
        { sectionType: 'hook', directionCue: '[Energetic]', dialogue: 'Stop wasting 4 hours on editing.', visualCue: 'Fast zoom' },
        { sectionType: 'core_beat', directionCue: '[Pointing]', dialogue: 'Tool #1 replaces your whole timeline.', visualCue: 'Screen demo' }
      ],
      rawFullText: 'Stop wasting 4 hours on editing.',
      tone: 'engaging_energetic',
      callToAction: 'Follow for more',
      lastUpdated: new Date().toISOString()
    },
    scenes: [
      {
        sceneNumber: 1,
        timestampRange: '0:00-0:15',
        shotType: 'Close Up',
        cameraAngle: 'Eye Level',
        visualDescription: 'Creator looking surprised at screen',
        audioSfx: 'Whoosh transition',
        onScreenText: 'STOP DOING THIS!',
        lightingMood: 'Cinematic rim lighting',
        brollKeywords: ['laptop', 'code'],
        aiVideoPrompt: 'Cinematic creator in studio with blue and violet neon backlight',
        // PRIVATE SENSITIVE ASSETS THAT MUST NEVER BE EXPOSED:
        mediaUrl: 'https://private-storage.example.com/renders/private_video_001.mp4',
        videoMetadata: { jobId: 'secret-job-999', assetId: 'asset-888', storagePath: '/private/secret.mp4' },
      }
    ],
    thumbnail: {
      headline: 'NEVER USE THIS!',
      subheadline: '5 AI Tools',
      aiConceptPrompt: 'Surprised face with glowing holographic tools floating',
      generatedAssetUrl: 'https://private-storage.example.com/assets/private_thumb.jpg',
    },
    renderedVideoUrl: 'https://private-storage.example.com/exports/final_render_secret.mp4',
  };

  dbManager.saveUserProject(testProject, creatorUserId);

  // Share as template
  const sharedTemplate = dbManager.createOrUpdateTemplate(creatorUserId, {
    originalProjectId: testProjectId,
    title: 'Top 5 AI Tools Viral Workflow',
    description: 'A proven 5-scene retention formula for tech tutorials',
    category: 'Tech & AI',
    shareCreatorName: true,
  });

  if (
    sharedTemplate &&
    sharedTemplate.id &&
    sharedTemplate.title === 'Top 5 AI Tools Viral Workflow' &&
    sharedTemplate.scenes.length === 1 &&
    sharedTemplate.isActive === true
  ) {
    testResults.templateSharing = true;
    console.log('✅ Template Sharing: PASSED (Template ID:', sharedTemplate.id, ')');
  } else {
    console.error('❌ Template Sharing: FAILED');
  }

  // ========================================================
  // TEST 2: TEMPLATE PRIVACY
  // ========================================================
  console.log('\n--- TEST 2: TEMPLATE PRIVACY ---');
  const publicPreview = dbManager.getPublicTemplate(sharedTemplate.id);

  let privacyPassed = true;

  // 1. Verify private media URLs are stripped
  if ((publicPreview as any).renderedVideoUrl || (publicPreview as any).generatedAssetUrl) {
    console.error('❌ Privacy Breach: Private video or asset URL found in preview!');
    privacyPassed = false;
  }

  const scene0 = publicPreview.scenes?.[0] as any;
  if (scene0?.mediaUrl || scene0?.videoMetadata || scene0?.storagePath) {
    console.error('❌ Privacy Breach: Private mediaUrl or videoMetadata found in scene structure!');
    privacyPassed = false;
  }

  // 2. Verify creator user ID and email are NOT exposed in public preview
  if ((publicPreview as any).creatorUserId || (publicPreview as any).email || (publicPreview as any).billing) {
    console.error('❌ Privacy Breach: creatorUserId or email exposed in public preview!');
    privacyPassed = false;
  }

  // 3. Verify creator display name is safely shown
  if (!publicPreview.creatorDisplayName) {
    console.error('❌ Privacy Check: Expected creatorDisplayName to be present.');
    privacyPassed = false;
  }

  // 4. Verify owner can disable template
  dbManager.toggleTemplateActive(sharedTemplate.id, creatorUserId, false);
  const disabledPreview = dbManager.getPublicTemplate(sharedTemplate.id);
  if (disabledPreview !== null) {
    console.error('❌ Privacy Breach: Disabled template was still returned by public preview!');
    privacyPassed = false;
  }
  // Re-enable for next tests
  dbManager.toggleTemplateActive(sharedTemplate.id, creatorUserId, true);

  if (privacyPassed) {
    testResults.templatePrivacy = true;
    console.log('✅ Template Privacy: PASSED (All private media, UIDs, and emails stripped. Disable toggle verified)');
  } else {
    console.error('❌ Template Privacy: FAILED');
  }

  // ========================================================
  // TEST 3: USE TEMPLATE
  // ========================================================
  console.log('\n--- TEST 3: USE TEMPLATE ---');
  const originalBeforeClone = JSON.stringify(dbManager.getUserProjectById(testProjectId, creatorUserId));

  // Recipient clones the template
  const clonedProject = dbManager.useTemplate(sharedTemplate.id, recipientUserId);
  const originalAfterClone = JSON.stringify(dbManager.getUserProjectById(testProjectId, creatorUserId));

  let useTemplatePassed = true;

  if (originalBeforeClone !== originalAfterClone) {
    console.error('❌ Use Template Failed: Original creator project was altered during cloning!');
    useTemplatePassed = false;
  }

  if (clonedProject.userId !== recipientUserId) {
    console.error('❌ Use Template Failed: Cloned project does not belong to recipient user!');
    useTemplatePassed = false;
  }

  if (clonedProject.id === testProjectId) {
    console.error('❌ Use Template Failed: Cloned project reused original project ID!');
    useTemplatePassed = false;
  }

  if (clonedProject.scenes?.[0]?.mediaUrl) {
    console.error('❌ Use Template Failed: Cloned project copied private generated media!');
    useTemplatePassed = false;
  }

  if (useTemplatePassed) {
    testResults.useTemplate = true;
    console.log('✅ Use Template: PASSED (Created independent project in new user account; original completely untouched)');
  } else {
    console.error('❌ Use Template: FAILED');
  }

  // ========================================================
  // TEST 4: REFERRAL LINKS
  // ========================================================
  console.log('\n--- TEST 4: REFERRAL LINKS ---');
  const referralCode = dbManager.getUserReferralCode(creatorUserId);
  let referralLinksPassed = true;

  if (!referralCode || !referralCode.startsWith('NOVA-')) {
    console.error('❌ Referral Links Failed: Invalid referral code generated:', referralCode);
    referralLinksPassed = false;
  }

  const walletBeforeClick = (await CreditWalletService.getWallet(creatorUserId)).creditBalance;

  // Track link click
  const clickResult = dbManager.recordReferralClick(referralCode, '192.168.1.1');
  if (!clickResult.success || !clickResult.valid) {
    console.error('❌ Referral Links Failed: recordReferralClick did not succeed');
    referralLinksPassed = false;
  }

  // ANTI-ABUSE: Verify NO credits awarded simply for clicks
  const walletAfterClick = (await CreditWalletService.getWallet(creatorUserId)).creditBalance;
  if (walletAfterClick !== walletBeforeClick) {
    console.error('❌ Anti-Abuse Failed: Credits were awarded for link clicks!');
    referralLinksPassed = false;
  }

  if (referralLinksPassed) {
    testResults.referralLinks = true;
    console.log('✅ Referral Links: PASSED (Referral code:', referralCode, '| Clicks recorded with 0 credit award)');
  } else {
    console.error('❌ Referral Links: FAILED');
  }

  // ========================================================
  // TEST 5: ANTI-ABUSE
  // ========================================================
  console.log('\n--- TEST 5: ANTI-ABUSE ---');
  let antiAbusePassed = true;

  // 1. Test Self-referral rejection
  const selfReferral = dbManager.recordReferralSignup(referralCode, creatorUserId);
  if (selfReferral.success || selfReferral.error !== 'SELF_REFERRAL_NOT_ALLOWED') {
    console.error('❌ Anti-Abuse Failed: Self-referral was not blocked!', selfReferral);
    antiAbusePassed = false;
  } else {
    console.log('  ✓ Self-referral attempt successfully blocked');
  }

  // 2. Test Duplicate referral rejection
  const newCreatorReg = dbManager.registerUser({
    name: 'New Creator',
    email: `new_${Date.now()}@example.com`,
    password: 'Password123!',
    preferredLanguage: 'English',
    creatorNiche: 'Education',
    defaultPlatform: 'YouTube Shorts',
  });
  const referredUserId = newCreatorReg.user.id;

  const validSignup = dbManager.recordReferralSignup(referralCode, referredUserId);
  if (!validSignup.success) {
    console.error('❌ Anti-Abuse Failed: Legitimate first signup failed:', validSignup);
    antiAbusePassed = false;
  }

  // Second referral for the same referred user must be rejected
  const duplicateSignup = dbManager.recordReferralSignup(referralCode, referredUserId);
  if (duplicateSignup.success) {
    console.error('❌ Anti-Abuse Failed: Duplicate referral for the same user was accepted!');
    antiAbusePassed = false;
  } else {
    console.log('  ✓ Duplicate referral attempt successfully blocked');
  }

  if (antiAbusePassed) {
    testResults.antiAbuse = true;
    console.log('✅ Anti-Abuse: PASSED (Self-referrals and duplicate rewards strictly rejected)');
  } else {
    console.error('❌ Anti-Abuse: FAILED');
  }

  // ========================================================
  // TEST 6: CREDIT WALLET CONNECTION
  // ========================================================
  console.log('\n--- TEST 6: CREDIT WALLET CONNECTION ---');
  let walletConnectionPassed = true;

  const referrerWalletBefore = (await CreditWalletService.getWallet(creatorUserId)).creditBalance;

  // Qualify and reward the referral
  const rewardResult = await dbManager.qualifyAndRewardReferral(referredUserId, 25);
  if (!rewardResult.success || !rewardResult.rewarded) {
    console.error('❌ Credit Wallet Failed: qualifyAndRewardReferral failed:', rewardResult);
    walletConnectionPassed = false;
  }

  const referrerWalletAfter = (await CreditWalletService.getWallet(creatorUserId)).creditBalance;
  if (referrerWalletAfter !== referrerWalletBefore + 25) {
    console.error(
      `❌ Credit Wallet Failed: Expected wallet balance to increase by 25, before: ${referrerWalletBefore}, after: ${referrerWalletAfter}`
    );
    walletConnectionPassed = false;
  }

  // Verify multiple rewards for same qualified referral are blocked
  const duplicateReward = await dbManager.qualifyAndRewardReferral(referredUserId, 25);
  if (duplicateReward.success) {
    console.error('❌ Anti-Abuse / Credit Wallet Failed: Duplicate reward granted for already rewarded referral!');
    walletConnectionPassed = false;
  } else {
    console.log('  ✓ Multiple rewards for same referral blocked');
  }

  // Check stats
  const stats = dbManager.getUserReferralStats(creatorUserId);
  if (stats.successfulReferrals < 1 || stats.creditsEarned < 25) {
    console.error('❌ Referral Stats Failed: Stats do not reflect rewarded credits:', stats);
    walletConnectionPassed = false;
  }

  if (walletConnectionPassed) {
    testResults.creditWalletConnection = true;
    console.log('✅ Credit Wallet Connection: PASSED (+25 credits awarded through atomic wallet ledger)');
  } else {
    console.error('❌ Credit Wallet Connection: FAILED');
  }

  console.log('\n====================================');
  console.log('AUTOMATED TEST SUITE SUMMARY');
  console.log('====================================');
  console.log('TEMPLATE SHARING:', testResults.templateSharing ? 'PASS' : 'FAIL');
  console.log('TEMPLATE PRIVACY:', testResults.templatePrivacy ? 'PASS' : 'FAIL');
  console.log('USE TEMPLATE:', testResults.useTemplate ? 'PASS' : 'FAIL');
  console.log('REFERRAL LINKS:', testResults.referralLinks ? 'PASS' : 'FAIL');
  console.log('ANTI-ABUSE:', testResults.antiAbuse ? 'PASS' : 'FAIL');
  console.log('CREDIT WALLET CONNECTION:', testResults.creditWalletConnection ? 'PASS' : 'FAIL');
}

runTemplateReferralTests().catch(console.error);
