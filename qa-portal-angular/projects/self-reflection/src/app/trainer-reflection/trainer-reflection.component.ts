import { Component, OnInit } from '@angular/core';
import { SelfReflectionService } from './services/self-reflection.service';
import { Reflection } from './models/dto/reflection';
import { Trainee } from './models/dto/trainee';
import { Question } from './models/dto/question';
import { ReflectionQuestion } from './models/dto/reflection-question';
import { ActivatedRoute, ParamMap, RouteConfigLoadEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { RowData } from './models/row-data';
import { QaToastrService } from '.././../../../portal-core/src/app/_common/services/qa-toastr.service';
import { QaErrorHandlerService } from 'projects/portal-core/src/app/_common/services/qa-error-handler.service';
import { Observer, Observable, Subscription } from 'rxjs';
import { resolve } from 'dns';

enum PageState {
  LOADING = 'loading', NO_SELF_REFLECTIONS = 'no-self-reflections', READY = 'ready', ERROR = 'error'
}

@Component({
  selector: 'app-trainer-reflection',
  templateUrl: './trainer-reflection.component.html',
  styleUrls: ['./trainer-reflection.component.css']
})
export class TrainerReflectionComponent implements OnInit {

  public COL_MAX = 24;
  public trainee: Trainee = new Trainee();
  public reflections: Reflection[] = [];
  public questions: Question[] = [];
  public trainerFeedback = '';
  public learningPathway = '';
  public rowData: RowData[] = [];
  public disableInputs = false;
  public questionIds = [];
  public loaded = false;
  public authors = ['Self', 'Trainer'];
  public pageState: PageState;
  public updateMessage = ' successfully updated.';

  constructor(
    private reflectionService: SelfReflectionService, private activatedRoute: ActivatedRoute, private snackBar: MatSnackBar,
    private toastrService: QaToastrService, private errorService: QaErrorHandlerService) {
    this.pageState = PageState.LOADING;

  }

  private updateReflections() {
    this.reflections.sort((a, b): number => {
      const aVal = new Date(a.lastUpdatedTimestamp);
      const bVal = new Date(b.lastUpdatedTimestamp);
      if (aVal > bVal) {
        return -1;
      } else if (aVal < bVal) {
        return 1;
      } else {
        return 0;
      }
    });
    for (const reflection of this.reflections) {
      if (!this.trainerFeedback && reflection.trainerFeedback) {
        this.trainerFeedback = reflection.trainerFeedback;
      }
      if (!this.learningPathway && reflection.learningPathway) {
        this.learningPathway = reflection.learningPathway;
      }
      for (const reflectionQuestion of reflection.reflectionQuestions) {
        this.rowData.forEach((rowData) => {
          const q = rowData.questions.find(question => question.id === reflectionQuestion.question.id);
          if (q) {
            q.reflectionQuestions.push(reflectionQuestion);
          }
        });
      }
    }
    this.pageState = PageState.READY;
  }

  /**
   * Errors that prevent the flow of the program but may not redirect to
   * the error page.
   * @param error error object to be handled by the QaErrorHandlerService.
   */
  private handleSevereError(error): void {
    this.errorService.handleError(error);
    this.pageState = PageState.ERROR;
  }

  public saveReflectionQuestions(): void {
    this.disableInputs = true;
    const reflectionQuestions: ReflectionQuestion[] = [];
    const betweenOneAndTen = i => Math.min(Math.max(1, i), 10);
    for (const reflection of this.reflections) {
      for (const reflectionQuestion of reflection.reflectionQuestions) {
        if (reflectionQuestion.response !== null) {
          reflectionQuestion.response = betweenOneAndTen(reflectionQuestion.response);
        }
        if (reflectionQuestion.trainerResponse !== null) {
          reflectionQuestion.trainerResponse = betweenOneAndTen(reflectionQuestion.trainerResponse);
        }
        if (reflectionQuestion.id !== null) {
          reflectionQuestions.push(reflectionQuestion);
        }
      }
    }
    this.reflectionService.updateReflectionQuestions(reflectionQuestions)
      .subscribe(updatedReflections => {
        this.toastrService.showSuccess(`Reflection ${this.updateMessage}`);
        this.disableInputs = false;
      }, error => {
        this.errorService.handleError(error);
      });
  }

  public saveTrainerFeedback(newFeedback: string): void {
    if (this.reflections.length > 0) {
      const newestReflection = this.reflections[0];
      newestReflection.trainerFeedback = newFeedback;
      this.reflectionService.updateReflection(newestReflection)
        .subscribe(updatedReflection => {
          this.trainerFeedback = updatedReflection.trainerFeedback;
          this.toastrService.showSuccess(`Trainer Feedback ${this.updateMessage}`);
        }, error => this.errorService.handleError(error));
    }
  }

  public saveLearningPathway(newPathway: string): void {
    if (this.reflections.length > 0) {
      const newestReflection = this.reflections[0];
      newestReflection.learningPathway = newPathway;
      this.reflectionService.updateReflection(newestReflection)
        .subscribe(updatedReflection => {
          this.learningPathway = updatedReflection.learningPathway;
          this.toastrService.showSuccess(`Learning Pathway ${this.updateMessage}`);
        }, error => this.errorService.handleError(error));
    }
  }


  ngOnInit() {
    // Get trainee id from path
    this.activatedRoute.paramMap.subscribe((pm: ParamMap): void => {
      const traineeId = +pm.get('id');
      // Get trainee
      this.reflectionService.getTraineeById(traineeId).subscribe((trainee: Trainee): void => {
        this.trainee = trainee;
        // Get questions.
        this.reflectionService.getQuestionsByCohortId(this.trainee.cohort.id)
          .subscribe(questions => {
            this.questions = questions.sort((a, b) => {
              const aVal = a.id;
              const bVal = b.id;
              if (aVal < bVal) {
                return -1;
              } else if (aVal > bVal) {
                return 1;
              } else {
                return 0;
              }
            });
            this.questions.forEach(question => {
              const categories = this.rowData.map(rowData => rowData.category);
              if (!categories.includes(question.category)) {
                this.rowData.push(
                  {
                    category: question.category,
                    questions: [],
                  }
                );
              }
              if (!this.questionIds.includes(question.id)) {
                this.questionIds.push(question.id);
              }
            });
            for (const question of this.questions) {
              const category = this.rowData.find(rowData => rowData.category === question.category);
              if (category !== undefined) {
                category.questions.push({ id: question.id, body: question.body, reflectionQuestions: [] });
              }
            }
            // Get reflections for this user
            this.reflectionService.getReflectionsByTraineeId(traineeId)
              .subscribe(reflections => {
                if (reflections && reflections.length > 0) {
                  let num = 0;
                  // TODO: Change to async
                  reflections.forEach((reflection: Reflection, index: number): void => {
                    this.reflectionService.getReflectionQuestionsByReflectionId(reflection.id)
                      .subscribe((reflectionQuestions: ReflectionQuestion[]): void => {
                        Reflection.setReflectionQuestions(reflection, reflectionQuestions, this.questionIds);
                        this.reflections.push(reflection);
                        if (num === reflections.length - 1) {
                          this.updateReflections();
                        } else {
                          ++num;
                        }
                      });
                  }, error => this.errorService.handleError(error));
                } else {
                  this.pageState = PageState.NO_SELF_REFLECTIONS;
                }
              }, error => this.handleSevereError(error));
          }, error => this.handleSevereError(error));
      }, error => this.handleSevereError(error));
    }, error => this.handleSevereError(error));
  }
}
