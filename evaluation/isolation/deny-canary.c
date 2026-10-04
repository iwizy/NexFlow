#include <errno.h>
#include <arpa/inet.h>
#include <fcntl.h>
#include <spawn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/wait.h>
#include <unistd.h>
extern char **environ;

/* Synthetic controls only: local files, socket creation and harmless children. */
int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--benign") == 0) return 0;
    if (argc != 4) return 2;
    int results[7], fd, status;
    errno = 0; fd = open(argv[1], O_RDONLY); results[0] = fd >= 0 ? 0 : errno;
    if (fd >= 0) close(fd);
    errno = 0; fd = open(argv[2], O_WRONLY | O_CREAT | O_TRUNC, 0600);
    results[1] = fd >= 0 ? 0 : errno;
    if (fd >= 0) { (void)write(fd, "synthetic-write", 15); close(fd); }
    struct sockaddr_in address = {0};
    address.sin_family = AF_INET; address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    address.sin_port = htons((unsigned short)atoi(argv[3]));
    fd = socket(AF_INET, SOCK_STREAM, 0);
    errno = 0; results[2] = connect(fd, (struct sockaddr *)&address, sizeof(address)) == 0 ? 0 : errno;
    if (fd >= 0) close(fd);
    address.sin_port = 0;
    fd = socket(AF_INET, SOCK_STREAM, 0);
    errno = 0; results[3] = bind(fd, (struct sockaddr *)&address, sizeof(address)) == 0 ? 0 : errno;
    if (fd >= 0) close(fd);
    errno = 0; pid_t pid = fork(); results[4] = pid >= 0 ? 0 : errno;
    if (pid == 0) _exit(0);
    if (pid > 0) waitpid(pid, &status, 0);
    char *true_argv[] = {"/usr/bin/true", NULL};
    results[5] = posix_spawn(&pid, true_argv[0], NULL, NULL, true_argv, environ);
    if (results[5] == 0) waitpid(pid, &status, 0);
    char *self_argv[] = {argv[0], "--benign", NULL};
    results[6] = posix_spawn(&pid, argv[0], NULL, NULL, self_argv, environ);
    if (results[6] == 0) waitpid(pid, &status, 0);
    printf("{\"read\":%d,\"write\":%d,\"connect\":%d,\"bind\":%d,\"fork\":%d,\"spawn\":%d,\"spawnSelf\":%d}\n",
           results[0], results[1], results[2], results[3], results[4], results[5], results[6]);
    return 0;
}
