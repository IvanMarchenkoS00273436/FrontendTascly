import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VoiceInputService {
    private recognition: any;
    private transcriptSubject: Subject<string> | null = null;
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
                this.transcriptSubject?.next(transcript);
                this.transcriptSubject?.complete();
                this.transcriptSubject = null;
                this.isListening = false;
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                this.transcriptSubject?.error(event.error);
                this.transcriptSubject = null;
                this.isListening = false;
            };

            this.recognition.onend = () => {
                // Complete the subject if it wasn't already completed (e.g. no result)
                this.transcriptSubject?.complete();
                this.transcriptSubject = null;
                this.isListening = false;
            };
        }
    }

    startListening(): Observable<string> {
        if (!this.recognition) {
            throw new Error('Speech recognition is not supported in this browser');
        }

        // Stop any in-progress session and complete old subject cleanly
        if (this.isListening) {
            this.recognition.stop();
        }

        // Always create a fresh Subject so previous subscribers don't get duplicate results
        this.transcriptSubject = new Subject<string>();

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
