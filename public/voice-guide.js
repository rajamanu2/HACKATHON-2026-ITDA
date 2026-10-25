export function voiceGuide(lang){const te=lang==='te';const steps=te?[
 ['కాల్‌కు ముందు','రోగి ఫోన్ నంబరు +91 రూపంలో ఉందో చూడండి. రోగి AI కాల్‌కు అనుమతి ఇచ్చిన తర్వాత మాత్రమే అభ్యర్థించండి.'],
 ['భాష ఎంచుకోండి','తెలుగు లేదా English ఎంచుకోండి. ఒకేసారి ఒక ప్రశ్న అడిగి, స్పష్టంగా వినిపించని సమాధానాన్ని మళ్లీ అడుగుతుంది.'],
 ['వివరాలు చెప్పండి','పేరు, వయస్సు, గ్రామం, నోటి సమస్యలు, అవి ఎప్పటి నుండి ఉన్నాయి, అలవాట్ల గురించి సమాధానాలు ఇవ్వవచ్చు. తెలియనివి ఊహించవద్దు.'],
 ['విని నిర్ధారించండి','సహాయకురాలు వివరాలు తిరిగి చదువుతుంది. తప్పులను సరిచేసి, వివరాలు సేవ్ చేయడానికి అనుమతి ఇవ్వండి.'],
 ['భాగస్వామ్య రికార్డు','నిర్ధారించిన వివరాలు రోగి రికార్డులో ప్రత్యేక ఫోన్ వివరాలుగా సేవ్ అవుతాయి. వైద్యుని నిర్ణయాలు మారవు.'],
 ['ఆఫ్‌లైన్‌లో','ఈ సూచనలు ఇంటర్నెట్ లేకుండా చదవవచ్చు. ఫోన్ కాల్ అభ్యర్థనకు సర్వర్ మరియు ఇంటర్నెట్ అవసరం.']
 ]:[
 ['Before calling','Check that the saved mobile number includes +91. Request a call only after the patient has permitted an AI intake call.'],
 ['Choose a language','Select Telugu or English. The assistant asks one question at a time and repeats unclear answers.'],
 ['Share details','The patient can provide their name, age, village, mouth symptoms, duration and relevant habits. Unknown or declined answers must stay unknown.'],
 ['Listen and confirm','The assistant reads the answers back. The patient corrects mistakes and explicitly permits the confirmed answers to be saved.'],
 ['Shared record','Confirmed answers fill a separate phone-intake form in the shared patient record. Doctor decisions remain unchanged.'],
 ['While offline','These instructions are bundled on the device. Requesting a telephone call requires the online server and a configured voice provider.']
 ];return `<details class="card" id="voice-offline-guide"><summary>${te?'ఫోన్ వివరాల సహాయం · ఆఫ్‌లైన్‌లో అందుబాటులో':'Phone intake guide · available offline'}</summary>${steps.map(([title,text])=>`<h3>${title}</h3><p class="mini">${text}</p>`).join('')}</details>`;}
