import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VoiceInputService {
    private recognition: any;
    private transcriptSubject = new Subject<string>();
    private isListening = false;

    constructor() {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                this.transcriptSubject.next(transcript);
                this.isListening = false;
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                this.transcriptSubject.error(event.error);
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };
        }
    }

    startListening(): Observable<string> {
        if (!this.recognition) {
            throw new Error('Speech recognition is not supported in this browser');
        }
        if (this.isListening) {
            this.recognition.stop();
        }
        try {
            this.recognition.start();
            this.isListening = true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
        return this.transcriptSubject.asObservable();
    }

    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    isCurrentlyListening(): boolean {
        return this.isListening;
    }

    isSupported(): boolean {
        return !!this.recognition;
    }
}