import {Component, OnInit} from '@angular/core';
import {TrainerReflectionService} from './services/trainer-reflection.service';
import {ReflectionModel} from './models/dto/reflection.model';
import {TraineeModel} from './models/dto/trainee.model';
import {ReflectionQuestionModel} from './models/dto/reflection-question.model';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {RowData} from './models/row-data';
import {QaToastrService} from '.././../../../portal-core/src/app/_common/services/qa-toastr.service';
import {QaErrorHandlerService} from 'projects/portal-core/src/app/_common/services/qa-error-handler.service';
import {Observable} from 'rxjs';
import {QuestionModel} from '../_common/models/question.model';
import {PageEvent} from '@angular/material';

enum PageState {
  LOADING = 'loading', NO_SELF_REFLECTIONS = 'no-self-reflections', READY = 'ready', ERROR = 'error'
}

/**
 * Display a row of reflection responses from both a trainer and
 * trainee. If two reflection responses exist for the same
 * reflection and question, prefer the latest one. If reflection
 * questions exist for questions outside of the user's cohort,
 * don't show them. If a reflection question does not exist for
 * a question in the grid, disable those trainer and trainee fields.
 * If two reflections were created/updated on the same day, ordering
 * becomes inconsistent.
 * Trainer feedback and Learning pathway are taken from any reflection that
 * has those entries as non-null, but they're saved to the latest
 * reflection.
 */
@Component({
  selector: 'app-trainer-reflection',
  templateUrl: './trainer-reflection.component.html',
  styleUrls: ['./trainer-reflection.component.css']
})
export class TrainerReflectionComponent implements OnInit {

  public COL_MAX = 24;
  public trainee: TraineeModel = new TraineeModel();
  public reflections: ReflectionModel[] = [];
  public questions: QuestionModel[] = [];
  public trainerFeedback = '';
  public learningPathway = '';
  public rowData: RowData[] = [];
  public disableInputs = false;
  public questionIds = [];
  public authors = [['', 'Self'], ['Self', 'Trainer']];
  public pageState: PageState;
  public updateMessage = ' successfully updated.';
  public visibleReflections: ReflectionModel[] = [];
  private pageIndex = 0;
  public entriesPerPage = 100;

  constructor(
    private reflectionService: TrainerReflectionService,
    private activatedRoute: ActivatedRoute,
    private toastrService: QaToastrService,
    private errorService: QaErrorHandlerService,
    private router: Router) {
    this.pageState = PageState.LOADING;
  }

  ngOnInit() {
    // Get trainee id from path
    this.activatedRoute.paramMap.subscribe((pm: ParamMap): void => {
      const traineeId = +pm.get('id');
      // Get trainee
      this.reflectionService.getTraineeById(traineeId).subscribe((trainee: TraineeModel): void => {
        this.trainee = trainee;

        // Get questions.
        this.reflectionService.getQuestionsByFormType('reflection_form')
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
              if (categories.length === 0 || !categories.includes(question.questionCategoryName)) {
                this.rowData.push(
                  {
                    category: question.questionCategoryName,
                    questions: [],
                  }
                );
              }

              if (!this.questionIds.includes(question.id)) {
                this.questionIds.push(question.id);
              }
            });

            for (const question of this.questions) {
              const category = this.rowData.find(rowData => rowData.category === question.questionCategoryName);
              if (category !== undefined) {
                category.questions.push({id: question.id, body: question.body, reflectionQuestions: []});
              }
            }

            // Get reflections for this user
            this.reflectionService.getReflectionsByTraineeId(traineeId)
              .subscribe(
                reflections => {
                  if (reflections && reflections.length > 0) {
                    let num = 0;
                    // TODO: Change to async
                    reflections.forEach((reflection: ReflectionModel, index): void => {
                        this.reflectionService.getReflectionQuestionsByReflectionId(reflection.id)
                          .subscribe(
                            (reflectionQuestions: ReflectionQuestionModel[]): void => {
                              if (reflectionQuestions.length >= questions.length) {
                                ReflectionModel.setReflectionQuestions(reflection, reflectionQuestions, this.questionIds);
                                this.reflections.push(reflection);
                              }

                              if (num === reflections.length - 1) {
                                this.updateReflections();
                              } else {
                                ++num;
                              }
                            });
                      },
                      error => this.errorService.handleError(error)
                    );
                  } else {
                    this.pageState = PageState.NO_SELF_REFLECTIONS;
                  }
                }, error => this.handleSevereError(error));
          }, error => this.handleSevereError(error));
      }, error => this.handleSevereError(error));
    }, error => this.handleSevereError(error));
  }


  private updateReflections() {
    this.reflections.sort((a, b): number => {
      const aVal = new Date(a.formDate);
      const bVal = new Date(b.formDate);
      if (aVal > bVal) {
        return -1;
      } else if (aVal < bVal) {
        return 1;
      } else {
        return 0;
      }
    });

    let i = 0;
    for (const reflection of this.reflections) {
      if (reflection.reflectionQuestions.length < this.questions.length) {
        this.reflections.splice(this.reflections.indexOf(reflection), 1);
      } else {
        if (!this.trainerFeedback && reflection.trainerFeedback && i === 0) {
          this.trainerFeedback = reflection.trainerFeedback;
        }
        if (!this.learningPathway && reflection.learningPathway && i === 0) {
          this.learningPathway = reflection.learningPathway;
        }
      }
      i++;
    }
    this.updateView();
    this.pageState = PageState.READY;
  }

  private updateView(): void {
    this.rowData.forEach(rd => {
      rd.questions.forEach(q => {
        q.reflectionQuestions = [];
      });
    });
    const start = this.pageIndex * this.entriesPerPage;
    const end = start + this.entriesPerPage;
    this.visibleReflections = this.reflections.slice(start, end);
    for (const reflection of this.visibleReflections) {
      for (const reflectionQuestion of reflection.reflectionQuestions) {
        this.rowData.forEach((rowData) => {
          const q = rowData.questions.find(question => question.id === reflectionQuestion.question.id);
          if (q) {
            q.reflectionQuestions.push(reflectionQuestion);
          }
        });
      }
    }
  }

  /**
   * Errors that prevent the flow of the program but may not redirect to
   * the error page. Shows a custom error dialogue.
   * @param error error object to be handled by the QaErrorHandlerService.
   */
  private handleSevereError(error): void {
    this.errorService.handleError(error);
    this.pageState = PageState.ERROR;
  }

  public noSelfReflectionMessage(): string {
    const userName = this.trainee && this.trainee.userName
      ? this.trainee.userName
      : 'this user';
    return `There are no Self Reflections for ${userName}.`;
  }

  private saveReflectionQuestions(): Observable<ReflectionQuestionModel[]> {
    this.disableInputs = true;
    const reflectionQuestions: ReflectionQuestionModel[] = [];
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
    return this.reflectionService.updateReflectionQuestions(reflectionQuestions);
  }

  public onSaveReflectionQuestions(): void {
    this.saveReflectionQuestions().subscribe(reflectionQuestions => {
      this.toastrService.showSuccess(`Reflection questions ${this.updateMessage}`);
      this.disableInputs = false;
    }, error => this.errorService.handleError(error));
  }

  public onSubmit(): void {
    if (this.reflections.length > 0) {
      const newestReflection = this.reflections[0];
      newestReflection.learningPathway = this.learningPathway;
      newestReflection.trainerFeedback = this.trainerFeedback;
      if (this.isFormCompleted()) {
        newestReflection.status = 'Reviewed';
      }
      this.reflectionService.updateReflection(newestReflection)
        .subscribe(updatedReflection => {
          if (updatedReflection.learningPathway !== this.learningPathway
            || updatedReflection.trainerFeedback !== this.trainerFeedback) {
            this.toastrService.showError('Unable to update reflection.');
          } else {
            this.saveReflectionQuestions().subscribe(reflectionQuestions => {
              this.toastrService.showSuccess(`Reflection form ${this.updateMessage}`);
              this.disableInputs = false;
              this.router.navigateByUrl('qa/portal/training/self-reflection/trainer/cohorts/trainees');
            }, error => this.errorService.handleError(error));
          }
        }, error => this.errorService.handleError(error));
    }
  }

  public onPagination(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.updateView();
  }

  isFormCompleted() {
    return !!this.learningPathway &&
      !!this.trainerFeedback &&
      this.questionsCompleted();
  }

  private questionsCompleted(): boolean {
    let questionsCompleted = true;
    this.rowData.forEach((row) => {
      questionsCompleted = questionsCompleted && !!row.questions[1].reflectionQuestions[0].trainerResponse;
    });
    return questionsCompleted;
  }
}
