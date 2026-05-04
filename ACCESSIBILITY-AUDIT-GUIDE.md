# 📘 WCAG Accessibility Audit - Completion Guide

**Purpose**: Step-by-step guide to complete the remaining accessibility audit tasks  
**Target Audience**: QA Team, Developers, Product Managers  
**Estimated Time**: 2-3 hours total

---

## 🎯 Overview

The HRBrain application has achieved **90% WCAG 2.1 Level AA compliance** with 52 automated tests passing. This guide will help you complete the remaining 10% verification tasks.

### ✅ Completed
- Unit tests for accessibility features (52 tests passing)
- Code review of accessibility implementations
- Frontend deployment verification

### ⚠️ Remaining Tasks
1. Lighthouse accessibility audit (5 min)
2. axe DevTools scan (10 min)
3. Color contrast verification (15 min)
4. Manual screen reader testing (1-2 hours)

---

## 📋 Task 1: Lighthouse Accessibility Audit

**Time**: 5 minutes  
**Difficulty**: Easy  
**Requirements**: Chrome browser

### Method 1: Chrome DevTools (Recommended)

#### Step 1: Open the Application
```
1. Open Google Chrome browser
2. Navigate to: http://192.168.1.12:30080
3. Wait for the page to fully load
```

#### Step 2: Open Lighthouse
```
1. Press F12 (or right-click → Inspect)
2. Click the "Lighthouse" tab in DevTools
   (If not visible, click >> and select Lighthouse)
```

#### Step 3: Configure Lighthouse
```
1. Device: Desktop (or Mobile for mobile audit)
2. Categories: Uncheck all EXCEPT "Accessibility"
3. Mode: Navigation (default)
4. Clear storage: Optional (recommended for clean test)
```

#### Step 4: Generate Report
```
1. Click "Analyze page load" button
2. Wait 30-60 seconds for analysis
3. Review the accessibility score (target: ≥90%)
```

#### Step 5: Review Results
```
Lighthouse will show:
- Overall accessibility score (0-100)
- Passed audits (green checkmarks)
- Failed audits (red X marks)
- Manual checks required (orange info icons)
```

#### Step 6: Export Report
```
1. Click the "⚙️" icon (top-right of report)
2. Select "Save as HTML"
3. Save to: lighthouse-accessibility-report.html
4. Optional: Click "View Trace" for detailed analysis
```

### Method 2: Lighthouse CLI

**Requirements**: Node.js, Chrome installed

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit
lighthouse http://192.168.1.12:30080 \
  --only-categories=accessibility \
  --output=html \
  --output=json \
  --output-path=lighthouse-accessibility-report \
  --view

# Reports generated:
# - lighthouse-accessibility-report.report.html
# - lighthouse-accessibility-report.report.json
```

### Expected Results

**Target Score**: ≥90%

**Common Passing Audits**:
- ✅ [aria-*] attributes match their roles
- ✅ [role] values are valid
- ✅ Elements with [role] have required [aria-*] attributes
- ✅ Buttons have an accessible name
- ✅ Links have a discernible name
- ✅ Form elements have associated labels
- ✅ [id] attributes are unique
- ✅ Heading elements appear in sequentially-descending order
- ✅ Lists contain only <li> elements
- ✅ [tabindex] values are not greater than 0

**Potential Issues to Check**:
- ⚠️ Background and foreground colors have sufficient contrast ratio
- ⚠️ Image elements have [alt] attributes
- ⚠️ [aria-hidden="true"] elements do not contain focusable descendants

### Troubleshooting

**Issue**: Lighthouse tab not visible in DevTools  
**Solution**: Update Chrome to latest version, or click >> → More tools → Lighthouse

**Issue**: "No Chrome installations found" (CLI)  
**Solution**: Install Chrome browser, or use DevTools method instead

**Issue**: Score below 90%  
**Solution**: Review failed audits, fix issues, re-run audit

---

## 📋 Task 2: axe DevTools Scan

**Time**: 10 minutes  
**Difficulty**: Easy  
**Requirements**: Chrome or Firefox browser

### Step 1: Install axe DevTools Extension

#### For Chrome:
```
1. Visit: https://chrome.google.com/webstore/
2. Search: "axe DevTools - Web Accessibility Testing"
3. Click "Add to Chrome"
4. Click "Add extension"
```

#### For Firefox:
```
1. Visit: https://addons.mozilla.org/
2. Search: "axe DevTools"
3. Click "Add to Firefox"
```

### Step 2: Open the Application
```
1. Navigate to: http://192.168.1.12:30080
2. Wait for the page to fully load
```

### Step 3: Run axe Scan
```
1. Press F12 to open DevTools
2. Click "axe DevTools" tab
3. Click "Scan ALL of my page" button
4. Wait 5-10 seconds for analysis
```

### Step 4: Review Results

**axe will categorize issues into**:
- 🔴 **Critical**: Must fix (WCAG Level A violations)
- 🟠 **Serious**: Should fix (WCAG Level AA violations)
- 🟡 **Moderate**: Consider fixing (best practices)
- 🔵 **Minor**: Nice to have (enhancements)

### Step 5: Investigate Issues
```
For each issue:
1. Click the issue to expand details
2. Review "Why it matters" explanation
3. Click "Inspect node" to see the element
4. Read "How to fix it" recommendations
5. Note the WCAG criterion violated
```

### Step 6: Export Report
```
1. Click "Export" button (top-right)
2. Choose format: CSV or JSON
3. Save to: axe-accessibility-report.csv
```

### Expected Results

**Target**: 0 critical issues, 0 serious issues

**Common Checks**:
- ✅ Color contrast (text vs background)
- ✅ Form labels and inputs
- ✅ ARIA attributes validity
- ✅ Keyboard accessibility
- ✅ Focus indicators
- ✅ Heading hierarchy
- ✅ Alt text for images
- ✅ Link text clarity

### Troubleshooting

**Issue**: axe tab not visible  
**Solution**: Restart browser after installing extension

**Issue**: "No violations found" but Lighthouse shows issues  
**Solution**: axe and Lighthouse use different rule sets; both are valuable

**Issue**: Too many issues to review  
**Solution**: Filter by severity (Critical → Serious → Moderate → Minor)

---

## 📋 Task 3: Color Contrast Verification

**Time**: 15 minutes  
**Difficulty**: Easy  
**Requirements**: Browser with DevTools

### Method 1: Chrome DevTools Contrast Checker

#### Step 1: Inspect Element
```
1. Navigate to: http://192.168.1.12:30080
2. Right-click on any text element
3. Select "Inspect"
```

#### Step 2: Check Contrast
```
1. In DevTools, click "Styles" tab
2. Find the "color" property
3. Click the color swatch (colored square)
4. Look for "Contrast ratio" section at bottom
```

#### Step 3: Verify Ratios
```
WCAG Requirements:
- Normal text (< 18pt): ≥4.5:1 (AA), ≥7:1 (AAA)
- Large text (≥ 18pt): ≥3:1 (AA), ≥4.5:1 (AAA)
- UI components: ≥3:1 (AA)

Chrome shows:
- ✅ Green checkmark = Passes AA
- ✅✅ Two checkmarks = Passes AAA
- ❌ Red X = Fails
```

#### Step 4: Test Key Elements
```
Check contrast for:
- Body text
- Headings (h1, h2, h3, etc.)
- Button text
- Link text
- Form labels
- Placeholder text
- Error messages
- Navigation items
```

### Method 2: WebAIM Contrast Checker

**URL**: https://webaim.org/resources/contrastchecker/

#### Step 1: Get Colors
```
1. Inspect element in DevTools
2. Copy foreground color (text color)
3. Copy background color
```

#### Step 2: Check Contrast
```
1. Visit: https://webaim.org/resources/contrastchecker/
2. Paste foreground color in "Foreground Color" field
3. Paste background color in "Background Color" field
4. Review results:
   - Contrast ratio (e.g., 7.5:1)
   - WCAG AA pass/fail
   - WCAG AAA pass/fail
```

### Method 3: Colour Contrast Analyser (Desktop App)

**Download**: https://www.tpgi.com/color-contrast-checker/

```
1. Download and install CCA
2. Use eyedropper tool to select colors
3. Review contrast ratio
4. Save results as screenshot
```

### Expected Results

**All text should meet**:
- Normal text: ≥4.5:1 contrast ratio
- Large text: ≥3:1 contrast ratio
- UI components: ≥3:1 contrast ratio

**Common Issues**:
- Light gray text on white background
- White text on light blue background
- Placeholder text too light
- Disabled button text too light (acceptable exception)

### Troubleshooting

**Issue**: Can't find contrast ratio in DevTools  
**Solution**: Update Chrome to version 89+, or use WebAIM online tool

**Issue**: Contrast ratio shows "N/A"  
**Solution**: Element may have gradient or image background; use manual tool

**Issue**: Disabled elements fail contrast  
**Solution**: Disabled elements are exempt from WCAG contrast requirements

---

## 📋 Task 4: Manual Screen Reader Testing

**Time**: 1-2 hours  
**Difficulty**: Moderate  
**Requirements**: Screen reader software

### Option 1: NVDA (Windows, Free)

#### Installation
```
1. Download: https://www.nvaccess.org/download/
2. Run installer
3. Follow setup wizard
4. Restart computer (optional but recommended)
```

#### Basic Controls
```
Start/Stop: Ctrl + Alt + N
Read next: Down Arrow
Read previous: Up Arrow
Read all: Insert + Down Arrow
Stop reading: Ctrl
Navigate headings: H
Navigate links: K
Navigate buttons: B
Navigate forms: F
```

#### Testing Checklist
```
✅ 1. Start NVDA (Ctrl + Alt + N)
✅ 2. Navigate to http://192.168.1.12:30080
✅ 3. Press Insert + Down Arrow to read entire page
✅ 4. Verify all content is announced
✅ 5. Press Tab to navigate interactive elements
✅ 6. Verify buttons/links are announced correctly
✅ 7. Fill out a form using only keyboard
✅ 8. Verify form labels are announced
✅ 9. Trigger validation errors
✅ 10. Verify error messages are announced
✅ 11. Open a modal/dialog
✅ 12. Verify focus trap works (Tab cycles within modal)
✅ 13. Press Escape to close modal
✅ 14. Verify focus returns to trigger element
✅ 15. Navigate using headings (H key)
✅ 16. Navigate using landmarks (D key)
✅ 17. Test multi-language support
✅ 18. Verify language changes are announced
```

### Option 2: JAWS (Windows, Commercial)

**Download**: https://www.freedomscientific.com/downloads/jaws/

**Trial**: 40-minute sessions (free)

#### Basic Controls
```
Start/Stop: Insert + J
Read next: Down Arrow
Read previous: Up Arrow
Read all: Insert + Down Arrow
Stop reading: Ctrl
Navigate headings: H
Navigate links: Tab
Navigate buttons: B
Navigate forms: F
```

#### Testing Checklist
Same as NVDA checklist above.

### Option 3: VoiceOver (macOS, Built-in)

#### Activation
```
Enable: Cmd + F5 (or System Preferences → Accessibility → VoiceOver)
Disable: Cmd + F5
```

#### Basic Controls
```
VoiceOver key: Ctrl + Option (VO)
Read next: VO + Right Arrow
Read previous: VO + Left Arrow
Read all: VO + A
Stop reading: Ctrl
Navigate headings: VO + Cmd + H
Navigate links: VO + Cmd + L
Navigate forms: VO + Cmd + J
```

#### Testing Checklist
Same as NVDA checklist above.

### Option 4: TalkBack (Android, Built-in)

#### Activation
```
Settings → Accessibility → TalkBack → Toggle On
Quick toggle: Volume Up + Volume Down (3 seconds)
```

#### Basic Controls
```
Read next: Swipe right
Read previous: Swipe left
Activate: Double-tap
Read from top: Swipe down then right
Stop reading: Two-finger tap
```

#### Testing Checklist
```
✅ 1. Enable TalkBack
✅ 2. Open browser and navigate to http://192.168.1.12:30080
✅ 3. Swipe right to navigate through content
✅ 4. Verify all elements are announced
✅ 5. Double-tap to activate buttons/links
✅ 6. Test form inputs
✅ 7. Test modal focus trap
✅ 8. Test multi-language support
```

### Expected Results

**All interactive elements should**:
- Be announced with their role (button, link, heading, etc.)
- Have clear, descriptive labels
- Be reachable via keyboard/swipe navigation
- Provide feedback when activated

**Forms should**:
- Announce labels before inputs
- Announce input type (text, email, password, etc.)
- Announce validation errors immediately
- Announce success messages

**Modals should**:
- Announce when opened
- Trap focus within modal
- Announce when closed
- Return focus to trigger element

### Common Issues and Fixes

**Issue**: Element not announced  
**Fix**: Add `aria-label` or `aria-labelledby` attribute

**Issue**: Button announced as "button" only (no label)  
**Fix**: Add text content or `aria-label` to button

**Issue**: Form input not associated with label  
**Fix**: Use `<label for="inputId">` or wrap input in `<label>`

**Issue**: Error message not announced  
**Fix**: Use `aria-live="assertive"` or `aria-describedby`

**Issue**: Modal focus not trapped  
**Fix**: Verify `useFocusTrap` hook is applied to modal container

---

## 📊 Reporting Results

### Create Summary Document

After completing all tasks, create a summary document:

```markdown
# WCAG Accessibility Audit - Final Results

## Date: [Current Date]
## Auditor: [Your Name]

### Lighthouse Score: [Score]/100
- Passed audits: [Number]
- Failed audits: [Number]
- Manual checks: [Number]

### axe DevTools Results:
- Critical issues: [Number]
- Serious issues: [Number]
- Moderate issues: [Number]
- Minor issues: [Number]

### Color Contrast:
- Elements checked: [Number]
- Passed: [Number]
- Failed: [Number]
- Issues found: [List issues]

### Screen Reader Testing:
- Screen reader used: [NVDA/JAWS/VoiceOver/TalkBack]
- Pages tested: [Number]
- Issues found: [List issues]
- Overall experience: [Excellent/Good/Fair/Poor]

### Overall Compliance: [Percentage]%
- Level A: [Pass/Fail]
- Level AA: [Pass/Fail]

### Recommendations:
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Next Steps:
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]
```

### Update Main Audit Report

Update `WCAG-ACCESSIBILITY-AUDIT.md` with:
- Lighthouse score
- axe DevTools results
- Color contrast verification results
- Screen reader testing notes
- Final compliance percentage

---

## 🎓 Best Practices

### During Testing

1. **Test with keyboard only** (unplug mouse)
2. **Test in multiple browsers** (Chrome, Firefox, Safari, Edge)
3. **Test on multiple devices** (desktop, tablet, mobile)
4. **Test with different zoom levels** (100%, 150%, 200%)
5. **Test with different font sizes** (use browser settings)
6. **Test in different languages** (if multi-language support)

### After Testing

1. **Document all issues** with screenshots
2. **Prioritize issues** by severity (Critical → Minor)
3. **Create tickets** for each issue in issue tracker
4. **Assign owners** to each issue
5. **Set deadlines** for fixes
6. **Schedule re-test** after fixes

### Ongoing Maintenance

1. **Run Lighthouse** on every release
2. **Include accessibility** in code review checklist
3. **Test with screen reader** monthly
4. **Update audit report** quarterly
5. **Train team** on accessibility best practices

---

## 📚 Resources

### Tools
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: https://www.tpgi.com/color-contrast-checker/

### Screen Readers
- **NVDA**: https://www.nvaccess.org/
- **JAWS**: https://www.freedomscientific.com/
- **VoiceOver**: Built-in on macOS/iOS
- **TalkBack**: Built-in on Android

### Learning Resources
- **WCAG 2.1 Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Deque University**: https://dequeuniversity.com/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Communities
- **WebAIM Discussion List**: https://webaim.org/discussion/
- **A11y Slack**: https://web-a11y.slack.com/
- **Reddit r/accessibility**: https://www.reddit.com/r/accessibility/

---

## ✅ Completion Checklist

Use this checklist to track your progress:

```
□ Task 1: Lighthouse Accessibility Audit
  □ Opened application in Chrome
  □ Ran Lighthouse audit
  □ Reviewed results
  □ Exported HTML report
  □ Documented score and issues

□ Task 2: axe DevTools Scan
  □ Installed axe DevTools extension
  □ Ran full page scan
  □ Reviewed all issues
  □ Exported CSV report
  □ Documented findings

□ Task 3: Color Contrast Verification
  □ Checked body text contrast
  □ Checked heading contrast
  □ Checked button contrast
  □ Checked link contrast
  □ Checked form label contrast
  □ Documented all ratios

□ Task 4: Manual Screen Reader Testing
  □ Installed screen reader
  □ Tested keyboard navigation
  □ Tested form inputs
  □ Tested modal focus traps
  □ Tested error announcements
  □ Tested multi-language support
  □ Documented experience

□ Reporting
  □ Created summary document
  □ Updated main audit report
  □ Created issue tickets
  □ Shared results with team
  □ Scheduled follow-up meeting

□ Follow-up
  □ Assigned owners to issues
  □ Set fix deadlines
  □ Scheduled re-test
  □ Updated documentation
```

---

**Guide Version**: 1.0  
**Last Updated**: 2026-05-04  
**Maintained By**: HRBrain DevOps Team  
**Contact**: taiebaminebelhadjali@gmail.com

---

**END OF GUIDE**
