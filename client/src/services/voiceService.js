// services/voiceService.js
class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.commands = [];
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.securityCheckRequired = false;
    this.pendingCommand = null;
    
    this.initializeSpeechRecognition();
    this.setupCommands();
  }

  /* ========== INITIALIZATION ========== */
  initializeSpeechRecognition() {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.continuous = false; // Changed to false for better command detection
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Event handlers
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onResultCallback) {
        this.onResultCallback({ 
          type: 'status', 
          message: 'Listening stopped', 
          isListening: false 
        });
      }
    };

    return true;
  }

  /* ========== COMMAND SETUP ========== */
  setupCommands() {
    this.commands = [
      // Add transaction commands - IMPROVED PATTERNS
      {
        patterns: [
          /add (?:an? )?(?:expense|spending|purchase|payment) (?:of )?(\d+(?:\.\d+)?)(?:\s*dollars?)?(?:\s+for|\s+on)?\s+(.+)/i,
          /(?:i )?(?:spent|paid|bought|purchased) (?:about )?(\d+(?:\.\d+)?)(?:\s*dollars?)?(?:\s+on|\s+for)?\s+(.+)/i,
          /(?:add|record|log) (?:expense|spending) (\d+(?:\.\d+)?)\s+(.+)/i,
          /(\d+(?:\.\d+)?)\s+(?:dollars? )?(?:for|on) (.+)/i
        ],
        action: (matches) => ({
          type: 'add_expense',
          amount: parseFloat(matches[1]),
          description: this.cleanDescription(matches[2]),
          category: this.extractCategory(matches[2])
        })
      },
      {
        patterns: [
          /add (?:an? )?(?:income|money|salary|payment) (?:of )?(\d+(?:\.\d+)?)(?:\s*dollars?)?(?:\s+from|\s+for)?\s+(.+)/i,
          /(?:i )?(?:received|got|earned|made) (?:about )?(\d+(?:\.\d+)?)(?:\s*dollars?)?(?:\s+from|\s+for)?\s+(.+)/i,
          /(?:add|record|log) (?:income|deposit) (\d+(?:\.\d+)?)\s+(.+)/i
        ],
        action: (matches) => ({
          type: 'add_income',
          amount: parseFloat(matches[1]),
          description: this.cleanDescription(matches[2]),
          category: this.extractIncomeCategory(matches[2])
        })
      },
      
      // Navigation commands
      {
        patterns: [
          /(?:show|go to|open|view) (?:the )?dashboard/i,
          /(?:take me to|navigate to) (?:the )?dashboard/i
        ],
        action: () => ({ type: 'navigate', route: '/' })
      },
      {
        patterns: [
          /(?:show|view|list) (?:all )?(?:my )?transactions/i,
          /(?:show|view) (?:transaction )?list/i
        ],
        action: () => ({ type: 'scroll_to', element: 'transactions' })
      },
      
      // Filter commands
      {
        patterns: [
          /(?:show|view|filter) (?:all )?(.+?) (?:expenses|transactions)/i,
          /filter (?:by )?(?:category )?(.+)/i
        ],
        action: (matches) => ({ 
          type: 'filter', 
          category: this.normalizeCategory(matches[1]) 
        })
      },
      {
        patterns: [
          /(?:show|view) (?:today[']?s?) (?:transactions|spending|expenses)/i,
          /what (?:did|have) i (?:spend|spent) today/i
        ],
        action: () => ({ type: 'filter_date', date: 'today' })
      },
      
      // Balance commands
      {
        patterns: [
          /what (?:is|'s) my (?:current )?balance/i,
          /how much money (?:do|does) i have/i,
          /check (?:my )?balance/i,
          /show (?:my )?balance/i
        ],
        action: () => ({ type: 'get_balance' })
      },
      
      // Delete commands - WITH SECURITY CHECK
      {
        patterns: [
          /delete (?:the )?last transaction/i,
          /remove (?:the )?last transaction/i,
          /undo (?:the )?last (?:transaction|entry)/i
        ],
        action: () => ({ 
          type: 'delete_last',
          requiresSecurity: true 
        })
      },
      {
        patterns: [
          /delete (?:all )?(.+?) (?:expenses|transactions)/i,
          /remove (?:all )?(.+?) (?:expenses|transactions)/i,
          /clear (?:all )?(.+?) (?:expenses|transactions)/i
        ],
        action: (matches) => ({ 
          type: 'delete_category', 
          category: this.normalizeCategory(matches[1]),
          requiresSecurity: true
        })
      },
      
      // Help command
      {
        patterns: [
          /what can i (?:say|do)/i,
          /help (?:with )?(?:commands|voice)/i,
          /show (?:available )?commands/i,
          /how (?:do|can) i use (?:this|voice commands)/i
        ],
        action: () => ({ type: 'show_help' })
      },
      
      // Stop command
      {
        patterns: [
          /stop (?:listening|voice)/i,
          /turn (?:the )?(?:microphone|voice) (?:off|on)/i,
          /exit voice (?:mode|command)/i
        ],
        action: () => ({ type: 'stop_listening' })
      }
    ];
  }

  /* ========== SPEECH PROCESSING ========== */
  handleResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      console.log('Final transcript:', finalTranscript);
      this.processCommand(finalTranscript);
    }

    if (this.onResultCallback) {
      this.onResultCallback({
        type: 'transcript',
        final: finalTranscript,
        interim: interimTranscript,
        isListening: this.isListening
      });
    }
  }

  handleError(event) {
    console.error('Speech recognition error:', event.error);
    this.isListening = false;
    
    let errorMessage = 'Speech recognition error';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'No microphone found. Please check your microphone.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access denied. Please allow microphone access.';
        break;
      case 'network':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = `Error: ${event.error}`;
    }
    
    if (this.onErrorCallback) {
      this.onErrorCallback(errorMessage);
    }
  }

  /* ========== COMMAND PROCESSING ========== */
  processCommand(transcript) {
    console.log('Processing command:', transcript);
    
    // Clean the transcript
    const cleaned = transcript.toLowerCase().trim();
    
    // Check for exact matches first
    for (const command of this.commands) {
      for (const pattern of command.patterns) {
        const matches = cleaned.match(pattern);
        if (matches) {
          const actionResult = command.action(matches);
          
          // Check if security check is required
          if (actionResult.requiresSecurity) {
            this.pendingCommand = {
              command: actionResult,
              transcript: transcript
            };
            
            if (this.onResultCallback) {
              this.onResultCallback({
                type: 'security_check',
                message: 'This action requires security confirmation. Please confirm to proceed.',
                command: actionResult
              });
            }
            return;
          }
          
          this.executeCommand(actionResult, transcript);
          return;
        }
      }
    }
    
    // If no command matched
    if (this.onResultCallback) {
      this.onResultCallback({
        type: 'unknown_command',
        transcript: transcript,
        message: "I didn't understand that. Try saying 'help' to see available commands."
      });
    }
  }

  executeCommand(command, originalTranscript) {
    if (this.onResultCallback) {
      this.onResultCallback({
        type: 'command',
        command: command,
        transcript: originalTranscript,
        message: this.generateResponseMessage(command)
      });
    }
  }

  // Method to confirm security-sensitive commands
  confirmSecurityCommand(confirm) {
    if (confirm && this.pendingCommand) {
      this.executeCommand(this.pendingCommand.command, this.pendingCommand.transcript);
      this.pendingCommand = null;
      return true;
    }
    this.pendingCommand = null;
    return false;
  }

  generateResponseMessage(command) {
    switch(command.type) {
      case 'add_expense':
        return `Adding $${command.amount} expense for ${command.category}`;
      case 'add_income':
        return `Adding $${command.amount} income for ${command.category}`;
      case 'navigate':
        return `Navigating to dashboard`;
      case 'filter':
        return `Filtering by ${command.category}`;
      case 'get_balance':
        return `Checking your balance`;
      case 'delete_last':
        return `Please confirm to delete the last transaction`;
      case 'delete_category':
        return `Please confirm to delete all ${command.category} expenses`;
      case 'show_help':
        return `Showing available commands`;
      case 'stop_listening':
        return `Stopping voice recognition`;
      default:
        return `Executing: ${command.type}`;
    }
  }

  /* ========== TEXT PROCESSING HELPERS ========== */
  extractCategory(text) {
    const categories = {
      'Food': ['food', 'restaurant', 'dining', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'coffee', 'groceries', 'grocery', 'snack', 'meal'],
      'Transportation': ['uber', 'lyft', 'taxi', 'bus', 'train', 'subway', 'gas', 'fuel', 'parking', 'transport', 'ride'],
      'Shopping': ['amazon', 'walmart', 'target', 'store', 'mall', 'clothes', 'shoes', 'shopping', 'purchase'],
      'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'show', 'entertainment', 'fun'],
      'Bills & Utilities': ['rent', 'mortgage', 'electricity', 'water', 'internet', 'phone', 'bill', 'utility'],
      'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medicine', 'medical', 'health', 'dentist'],
      'Education': ['school', 'college', 'university', 'course', 'class', 'book', 'education', 'tuition'],
      'Travel': ['hotel', 'flight', 'airbnb', 'vacation', 'trip', 'travel', 'holiday']
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  extractIncomeCategory(text) {
    const incomeCategories = {
      'Salary': ['salary', 'paycheck', 'wage', 'pay', 'employment'],
      'Freelance': ['freelance', 'contract', 'gig', 'project'],
      'Business': ['business', 'sales', 'revenue'],
      'Investment': ['investment', 'dividend', 'stock', 'interest'],
      'Gift': ['gift', 'present'],
      'Refund': ['refund', 'return', 'reimbursement']
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(incomeCategories)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other Income';
  }

  cleanDescription(text) {
    // Remove common filler words and clean up
    const fillerWords = ['for', 'on', 'a', 'an', 'the', 'my', 'this', 'that', 'and', 'with'];
    const words = text.toLowerCase().split(' ');
    const filtered = words.filter(word => 
      !fillerWords.includes(word) && 
      !/^\d+(\.\d+)?$/.test(word) &&
      word.length > 1
    );
    
    return filtered.join(' ').trim() || 'Voice command';
  }

  normalizeCategory(category) {
    const categoryMap = {
      'food': 'Food',
      'transport': 'Transportation',
      'transportation': 'Transportation',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'bills': 'Bills & Utilities',
      'utilities': 'Bills & Utilities',
      'rent': 'Bills & Utilities',
      'health': 'Healthcare',
      'healthcare': 'Healthcare',
      'medical': 'Healthcare',
      'education': 'Education',
      'travel': 'Travel',
      'salary': 'Salary',
      'income': 'Other Income'
    };

    const normalized = category.toLowerCase().trim();
    return categoryMap[normalized] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  /* ========== PUBLIC METHODS ========== */
  startListening() {
    if (!this.recognition) {
      if (!this.initializeSpeechRecognition()) {
        throw new Error('Speech recognition not supported');
      }
    }

    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        
        // Auto-stop after 10 seconds if no speech detected
        setTimeout(() => {
          if (this.isListening) {
            this.stopListening();
            if (this.onResultCallback) {
              this.onResultCallback({
                type: 'status',
                message: 'Auto-stopped listening. Click microphone to try again.',
                isListening: false
              });
            }
          }
        }, 10000);
        
        return true;
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        return false;
      }
    }
    return false;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        return true;
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        return false;
      }
    }
    return false;
  }

  toggleListening() {
    if (this.isListening) {
      return this.stopListening();
    } else {
      return this.startListening();
    }
  }

  setCallbacks(onResult, onError) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
  }

  speak(text, rate = 1.0) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.lang = 'en-US';
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const voiceService = new VoiceService();
export default voiceService;