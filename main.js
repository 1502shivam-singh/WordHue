/*
 *  Creator: @1502shivam-singh
 *  <shivam152002@gmail.com>
 *
 *  ✔ Implement popup trigger when highlighing text
 *  ✔ Debounce selection of text, to eliminate multiple wasteful API calls when highlighting
 *  ✔ Establish system for closing popup when clicking outside popup
 *  ✔ Establish system for closing popup when clicking outside popup
 *----------------------------------------------------------------------------------
 *  Response data structure -
 *  {
 *      meanings (Array of objects)
 *          [
 *              {
 *              definitions (Array of objects)
 *                  [{antonyms (Array), definition (string), example (string), synonyms (Array)}]
 *              , partOfSpeech (string)
 *              }
 *          ],
 *      origin (string),
 *      phonetic (string)
 *      phonetics (Array of objects)
 *          [
 *              {
 *                  audio (string)
 *                  text (string)
 *              }
 *          ]
 *  } 
 *
 */
const start = async () => {
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        files: ['dep/gsap.min.js']
    });
    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        function: seekHighlight,
    });
}

start();

function seekHighlight() {
    let string;

    const getSelectedText = (e) => {
        if (string.length > 1) {
            const popUp = document.createElement("div");
            popUp.className = "popUpContainer";
            popUp.tabIndex = 0;

            const popUpDim = {
                width: 400,
                height: 240,
            }

            const closePopUpEvent = (event) => {
                const xIn = {
                    x1: e.pageX,
                    x2: e.pageX + popUpDim.width,
                }
                const yIn = {
                    y1: e.pageY,
                    y2: e.pageY + popUpDim.height,
                }

                if (!((event.pageX >= xIn.x1 && event.pageX <= xIn.x2) && (event.pageY >= yIn.y1 && event.pageY <= yIn.y2))) {
                    gsap.to(popUp, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            window.removeEventListener('click', closePopUpEvent);
                            popUp.remove();
                        }
                    });
                }
            }

            window.addEventListener('click', closePopUpEvent);

            Object.assign(
                popUp.style, {
                    position: "absolute",
                    width: `${popUpDim.width}px`,
                    height: `${popUpDim.height}px`,
                    borderRadius: "5px",
                    background: "white",
                    left: `${e.pageX}px`,
                    top: `${e.pageY}px`,
                    zIndex: 1000,
                    opacity: 0,
                    padding: "10px",
                    filter: "drop-shadow(0 4px 10px rgb(0,0,0,.25))",
                    overflowY: "scroll",
                }
            )

            gsap.to(popUp, {
                opacity: 1,
                duration: 0.15,
            });

            document.body.appendChild(popUp);

            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${string}`)
                .then(response => response.json())
                .then(data => {
                    const {
                        meanings,
                        origin,
                        phonetic,
                        phonetics
                    } = data[0];
                    console.log({
                        meanings,
                        origin,
                        phonetic,
                        phonetics
                    });

                    //--------------------------------------------------------

                    let meaningFragment = document.createDocumentFragment();

                    let popUpbox = document.createElement('div');
                    let wordAndAudio = document.createElement('div');
                    let audio = document.createElement('div');
                    let audioSvg = document.createElement('object');
                    let wordSpell = document.createElement('p');
                    let wordPhonetic = document.createElement('p');

                    audioSvg.type = "image/svg+xml";
                    audioSvg.data = chrome.runtime.getURL("assets/audio.svg");
                    audioSvg.className = "audio-svg";
                    audioSvg.textContent = "Speaker logo";

                    audio.className = "audio";

                    let phoneticAudio = new Audio(phonetics[0].audio);
                    audio.addEventListener('click', (e)=>{
                        phoneticAudio.play();
                    });
                    
                    audio.appendChild(audioSvg);                    

                    //------------------------------------
                    wordSpell.className = "word-spell";
                    wordSpell.textContent = string;
                    wordAndAudio.className = "word-and-audio";

                    wordAndAudio.appendChild(audio);
                    wordAndAudio.appendChild(wordSpell);
                    //-------------------------------------

                    wordPhonetic.className = "word-phonetic";
                    wordPhonetic.textContent = `/${phonetic}/`;

                    popUpbox.className = "popup-box";

                    popUpbox.appendChild(wordAndAudio);
                    popUpbox.appendChild(wordPhonetic);

                    meanings.forEach((meaning, index) => {
                        let type = document.createElement('div');
                        type.className = "type";
                        type.textContent = meaning.partOfSpeech;
                        meaningFragment.appendChild(type);


                        meaning.definitions.forEach((info, i) => {

                            let subDescription = document.createElement('div');
                            subDescription.className = "subDescription";

                            let meaning = document.createElement('p');

                            meaning.className = "meaning";
                            meaning.textContent = `${i+1}.  ${info.definition}`;
                            subDescription.appendChild(meaning);

                            if (info.example != undefined) {
                                let sentence = document.createElement('li');
                                sentence.className = "sentence";
                                sentence.textContent = `\"${info.example}\"`;
                                subDescription.appendChild(sentence);
                            }

                            if (info.synonyms != undefined && info.synonyms.length !== 0) {
                                let similar = document.createElement('span');
                                similar.textContent = "similar: ";
                                let synonyms = document.createElement('div');
                                let lineBreak = document.createElement('br');
                                similar.className = "similar";
                                synonyms.className = "synonyms";
                                let synString = "";

                                for (let index = 0; index < info.synonyms.length; index++) {
                                    const element = info.synonyms[index];
                                    if (index === 6 || index === info.synonyms.length - 1) {
                                        synString += `${element}`;
                                        break;
                                    } else {
                                        synString += `${element}, `;
                                    }
                                }

                                synonyms.textContent = synString;
                                subDescription.appendChild(similar);
                                subDescription.appendChild(synonyms);
                                subDescription.appendChild(lineBreak);
                            }

                            if (info.antonyms != undefined && info.antonyms.length !== 0) {
                                let opposites = document.createElement('span');
                                opposites.textContent = "antonyms: ";
                                let antonyms = document.createElement('div');

                                opposites.className = "opposites";
                                antonyms.className = "antonyms";

                                let antString = "";

                                for (let index = 0; index < info.antonyms.length; index++) {
                                    const element = info.antonyms[index];
                                    if (index === 6 || index === info.antonyms.length - 1) {
                                        antString += `${element}`;
                                        break;
                                    } else {
                                        antString += `${element}, `;
                                    }
                                }

                                antonyms.textContent = antString;
                                subDescription.appendChild(opposites);
                                subDescription.appendChild(antonyms);
                            }

                            meaningFragment.appendChild(subDescription);
                        });
                    })

                    popUpbox.appendChild(meaningFragment);
                    popUp.appendChild(popUpbox);
                });
        }
        document.removeEventListener('mouseup', getSelectedText);
    }

    document.addEventListener('selectionchange', (e) => {
        string = window.getSelection().toString();
        document.addEventListener('mouseup', getSelectedText);
    });
}
