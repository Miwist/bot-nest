import {
  Ctx,
  Hears,
  InjectBot,
  Message,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { actionButtons } from './app.buttons';
import { AppService } from './app.service';
import { showList } from './app.utils';
import { Context } from './context.interface';

const todos = [
  {
    id: 1,
    name: 'Buy goods',
    isCompleted: false,
  },
  {
    id: 2,
    name: 'Go to walk',
    isCompleted: false,
  },
  {
    id: 3,
    name: 'Travel',
    isCompleted: true,
  },
];

@Update()
export class AppUpdate {
  constructor(@InjectBot() private readonly appService: AppService) {}

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply('Привет, дружище!');
    await ctx.reply('Что хочешь сделать?', actionButtons());
  }

  @Hears('💡 Создать задачу')
  async createTask(ctx: Context) {
    ctx.session.type = 'create';
    await ctx.deleteMessage();
    await ctx.reply('Опишите задачу: ');
  }

  @Hears('📋 Список задач')
  async listTask(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(showList(todos));
  }

  @Hears('❎ Завершить')
  async doneTask(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(`Напишите ID задачи, чтобы завершить: `);
    ctx.session.type = 'done';
  }
  @Hears('⭕ Удаление')
  async deleteTask(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(`Напишите ID задачи, чтобы удалить: `);
    ctx.session.type = 'delete';
  }
  @Hears('✏️ Редактирование')
  async editTask(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.replyWithHTML(
      'Напишите ID и новое название задачи: \n\n' +
        'В формате - <b>1 | Новое название</b>',
    );
    ctx.session.type = 'edit';
  }

  @On('text')
  async getMessage(@Message('text') message: string, @Ctx() ctx: Context) {
    if (!ctx.session.type) return;

    if (ctx.session.type === 'create') {
      const todos = await this.appService.createTask(message);
      await ctx.reply(showList(todos));
    }

    if (ctx.session.type === 'done') {
      const todo = todos.find((t) => t.id === Number(message));
      if (!todo) {
        await ctx.deleteMessage();
        await ctx.reply('Задачи с таким ID не найдено');
        return;
      }

      todo.isCompleted = !todo.isCompleted;
      await ctx.reply(showList(todos));
    }

    if (ctx.session.type === 'edit') {
      const [taskId, taskName] = message.split(' | ');
      const todo = todos.find((t) => t.id === Number(taskId));

      if (!todo) {
        await ctx.deleteMessage();
        await ctx.reply('Задачи с таким ID не найдено');
        return;
      }

      todo.name = taskName;
      await ctx.reply(showList(todos));
    }

    if (ctx.session.type === 'delete') {
      const todos = await this.appService.deleteTask(Number(message));
      if (!todos) {
        await ctx.deleteMessage();
        await ctx.reply('Задачи с таким ID не найдено');
        return;
      }

      await ctx.reply(showList(todos));
    }
  }
}
