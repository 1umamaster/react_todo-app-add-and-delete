/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useState } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, addTodo, deleteTodo, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { Filter, ErrorMessage } from './types/enums';
import classNames from 'classnames';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showError, setShowError] = useState<ErrorMessage | ''>('');
  const [filterSelected, setFilterSelected] = useState(Filter.All);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const todosLeft = todos.filter(todo => !todo.completed).length;
  const todoFieldRef = React.useRef<HTMLInputElement>(null);

  const focusField = () => {
    if (todoFieldRef.current) {
      todoFieldRef.current.focus();
    }
  };

  const handleDelete = (todoId: number) => {
    setDeletingIds(prev => [...prev, todoId]);
    deleteTodo(todoId)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(t => t.id !== todoId));
      })
      .catch(() => {
        setShowError(ErrorMessage.Delete);
      })
      .finally(() => {
        setDeletingIds(prev => prev.filter(id => id !== todoId));
        focusField();
      });
  };

  useEffect(() => {
    getTodos()
      .then(loadedTodos => {
        setTodos(loadedTodos);
      })
      .catch(() => {
        setShowError(ErrorMessage.Fetch);
      });
  }, []);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    return;
  }, [showError]);

  const visibleTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesFilter =
        filterSelected === Filter.All ||
        (filterSelected === Filter.Completed && todo.completed) ||
        (filterSelected === Filter.Active && !todo.completed);

      return matchesFilter;
    });
  }, [todos, filterSelected]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          USER_ID={USER_ID}
          addTodo={addTodo}
          setTodos={setTodos}
          setShowError={setShowError}
          setTempTodo={setTempTodo}
          todoFieldRef={todoFieldRef}
        />

        <TodoList
          todos={visibleTodos}
          deletingIds={deletingIds}
          handleDelete={handleDelete}
        />

        {tempTodo && (
          <div
            data-cy="Todo"
            className={classNames('todo', { completed: tempTodo.completed })}
          >
            <label className="todo__status-label">
              <input
                data-cy="TodoStatus"
                type="checkbox"
                className="todo__status"
                checked={tempTodo.completed}
                readOnly
              />
            </label>

            <span data-cy="TodoTitle" className="todo__title">
              {tempTodo.title}
            </span>

            <div
              data-cy="TodoLoader"
              className={classNames('modal', 'overlay', 'is-active')}
            >
              <div className="modal-background has-background-white-ter" />
              <div className="loader" />
            </div>
          </div>
        )}

        {todos.length > 0 && (
          <Footer
            todosLeft={todosLeft}
            filterSelected={filterSelected}
            setFilterSelected={setFilterSelected}
            todos={todos}
            handleDelete={handleDelete}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification',
          'is-danger',
          'is-light',
          'has-text-weight-normal',
          { hidden: !showError },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setShowError('')}
        />
        {showError}
      </div>
    </div>
  );
};
